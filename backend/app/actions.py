"""Deterministic action plan. Claude does not write this.

PS requires post-incident guidance to match procedures published by the reporting
authorities, so the model gets no opportunity to improvise it. That also means the
strings are translated here, by hand, rather than generated.
"""

import json

from .config import DATA
from .schemas import Action, Assessment

_ROUTES = json.loads((DATA / "trusted_routes.json").read_text())

_TEXT = {
    "en": {
        "do_not": [
            "Do not open any link from this message.",
            "Do not share OTP, PIN, password or card details with anyone - no bank or agency ever asks for them.",
            "Do not transfer money until the claim is verified through an official channel.",
            "Do not install any app they ask you to install.",
        ],
        "caution": [
            "Do not act on this message until you have checked it through an official channel.",
            "Do not share OTP, PIN, password or card details with anyone - no bank or agency ever asks for them.",
        ],
        "clicked": [
            "Turn off internet on that device and uninstall the app you installed.",
            "Change your banking passwords from a different, trusted device.",
        ],
        "creds": [
            "Change the password or PIN for the affected account now.",
            "Turn on two-factor authentication and call your bank's official number "
            "(from the back of your card, not from the message) to flag the account.",
        ],
        "money": [
            "Call your bank's official fraud helpline now and ask them to freeze the transaction. "
            "Reporting in the first hour gives the best chance of a hold.",
            "Call the national cyber-fraud helpline 1930.",
            "File a complaint on the National Cybercrime Reporting Portal (cybercrime.gov.in) "
            "and keep the acknowledgement number.",
            "Do not delete anything. Save the transaction ID, screenshots, the phone number and "
            "any links - you will be asked for them.",
        ],
    },
    "hi": {
        "do_not": [
            "इस मैसेज का कोई भी लिंक न खोलें।",
            "OTP, PIN, पासवर्ड या कार्ड की जानकारी किसी को न बताएं — कोई बैंक या सरकारी विभाग कभी नहीं मांगता।",
            "जब तक आधिकारिक चैनल से पुष्टि न हो जाए, पैसे न भेजें।",
            "वे जो ऐप इंस्टॉल करने को कह रहे हैं, वह इंस्टॉल न करें।",
        ],
        "caution": [
            "जब तक आधिकारिक चैनल से जांच न कर लें, इस मैसेज पर कोई कार्रवाई न करें।",
            "OTP, PIN, पासवर्ड या कार्ड की जानकारी किसी को न बताएं — कोई बैंक या सरकारी विभाग कभी नहीं मांगता।",
        ],
        "clicked": [
            "उस फोन का इंटरनेट बंद करें और जो ऐप इंस्टॉल किया था उसे तुरंत हटाएं।",
            "किसी दूसरे भरोसेमंद डिवाइस से अपने बैंकिंग पासवर्ड बदलें।",
        ],
        "creds": [
            "प्रभावित खाते का पासवर्ड या PIN अभी बदलें।",
            "टू-फैक्टर ऑथेंटिकेशन चालू करें और अपने बैंक के आधिकारिक नंबर पर (कार्ड के पीछे छपा नंबर, "
            "मैसेज वाला नहीं) कॉल करके खाता फ्लैग कराएं।",
        ],
        "money": [
            "अभी अपने बैंक की आधिकारिक फ्रॉड हेल्पलाइन पर कॉल करके ट्रांज़ैक्शन रोकने को कहें। "
            "पहले एक घंटे में रिपोर्ट करने पर पैसा रुकने की सबसे अच्छी संभावना होती है।",
            "राष्ट्रीय साइबर फ्रॉड हेल्पलाइन 1930 पर कॉल करें।",
            "National Cybercrime Reporting Portal (cybercrime.gov.in) पर शिकायत दर्ज करें और "
            "acknowledgement नंबर संभाल कर रखें।",
            "कुछ भी डिलीट न करें। ट्रांज़ैक्शन ID, स्क्रीनशॉट, फोन नंबर और लिंक सुरक्षित रखें — "
            "ये सब पूछे जाएंगे।",
        ],
    },
}


def build(a: Assessment, lang: str = "en") -> list:
    T = _TEXT.get(lang, _TEXT["en"])
    routes = _ROUTES.get(lang, _ROUTES["en"])
    out: list = []

    # A genuine message gets no scare list. An uncertain one gets a short caution,
    # not the full four-line warning - that is what makes a false alarm feel like one.
    if a.risk_state in ("SUSPICIOUS", "HIGH_RISK"):
        out += [Action(text=t, kind="do_not") for t in T["do_not"]]
    elif a.risk_state == "UNCERTAIN":
        out += [Action(text=t, kind="do_not") for t in T["caution"]]

    out.append(
        Action(
            text=routes.get(a.scam_dna.claim_type or "", routes["default"]),
            kind="verify",
            deadline_minutes=10,
        )
    )

    if a.user_state == "clicked_or_installed":
        out += [
            Action(text=T["clicked"][0], kind="do_now", deadline_minutes=10),
            Action(text=T["clicked"][1], kind="do_now", deadline_minutes=30),
        ]
    elif a.user_state == "credentials_shared":
        out += [
            Action(text=T["creds"][0], kind="do_now", deadline_minutes=10),
            Action(text=T["creds"][1], kind="do_now", deadline_minutes=30),
        ]
    elif a.user_state == "money_sent":
        m = T["money"]
        out = [
            Action(text=m[0], kind="do_now", deadline_minutes=60),
            Action(text=m[1], kind="do_now", deadline_minutes=60),
            Action(text=m[2], kind="do_now", deadline_minutes=60),
            Action(text=m[3], kind="preserve"),
        ] + out

    return out
