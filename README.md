# 🛡️ Digi संरक्षक AI

<p align="center">

<img width="1254" height="1254" alt="08b9a51e-ba3d-49fa-a152-6bbbcbee112e" src="https://github.com/user-attachments/assets/5f8e7021-1bb4-4452-872e-929d66a12240" />

</p>

<p align="center">

### **Ruko. Socho. Verify Karo.**

**AI-powered Scam Decision Assistant for safer digital payments and online interactions.**

</p>

<p align="center">

![PS-1](https://img.shields.io/badge/PS--1-Financial%20Safety-0A66FF?style=for-the-badge)
![Claude](https://img.shields.io/badge/AI-Claude-6B4EFF?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Installable-16A34A?style=for-the-badge)
![Privacy](https://img.shields.io/badge/Privacy-Zero%20Retention-059669?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-111827?style=for-the-badge)

</p>

---

## 👥 Team GLITCH

| Team Member |
|---|
| **Ayush Kumar** |
| **Nitish Singh** |
| **Harsh Kumar** |

---

<p align="center">

<img width="1024" height="559" alt="0a1165e8-8c6d-450d-a9c4-9a9ef37dca6b" src="https://github.com/user-attachments/assets/ae8339de-ab0a-4e10-9bed-1a7b0ebbe843" />

</p>

---

# 🎯 PS-1 — Is this a scam?

### **Theme: Financial Safety and Consumer Protection**

**Primary User:**  
An individual facing a suspicious message, call or app prompt.

**Secondary Users:**  
Family members assisting relatives; bank branch and cyber help-desk staff.

---

# 📋 PS-1 Problem Statement

## Background

Digital payments and instant credit have reached households in Bhopal and across Madhya Pradesh faster than the knowledge required to use them safely.

Fraud now arrives through the same channels people use every day:

- SMS
- Messaging apps
- Voice and video calls
- App stores
- Payment links
- Digital lending applications
- Investment and trading platforms

The common scripts are well documented.

Unregulated instant-loan apps may harvest a borrower's contacts and use them for extortion. Callers may impersonate bank staff over a supposed KYC expiry. Utility-disconnection messages may carry payment links. Parcel or customs-fee messages may demand a small payment. Investment and trading groups may display fabricated profits. Job offers may be conditioned on registration fees. “Digital arrest” calls may impersonate police or investigative agencies.

In rural areas, similar scripts can be adapted to agricultural credit, insurance and subsidy contexts.

---

## Problem Statement

> **An individual confronted with a suspicious message or call has no reliable way to assess it at the moment of decision, and no clear path to act if money has already gone.**

Public warnings exist, but they are often generic, scattered and difficult to retrieve under pressure.

Victims may not know about the national reporting channel, the 1930 helpline or the National Cybercrime Reporting Portal, or what steps to take immediately after a financial fraud.

Shame, uncertainty and delay can make the situation worse.

> **The gap is not the absence of guidance. It is the absence of a trusted, immediate, situation-specific assessment.**

---

## Proposed Solution

An assistant that accepts:

- A screenshot
- A pasted or forwarded message
- An app name
- A short description of a call

and returns:

- An assessment of fraud likelihood
- The specific indicators found
- An immediate action list for the next ten minutes
- Recovery and reporting guidance if money has already been transferred
- Lending-app verification against the Reserve Bank's published list of regulated-entity apps
- Guidance in the user's language
- Sources for the rules and facts it relies on

The assistant retains no user data beyond the session.

---

## Key Capabilities

### 1. Multi-modal Intake

Image, text, app name or free-text call description.

### 2. Pattern Recognition

Classification against a curated fraud taxonomy with indicators such as:

- Urgency
- OTP requests
- Unofficial links
- Payment-before-service
- Impersonation cues

### 3. Legitimacy Signals

Recognition of genuine bank, utility and courier communication patterns to help keep false alarms low.

### 4. Action Guidance

A do-not-do list, immediate actions and a reporting script containing the details a helpline may ask for.

### 5. Post-Incident Procedure

Bank / fraud-team contact, 1930, portal reporting and evidence preservation, with time-sensitive actions clearly flagged.

### 6. Lending-App Check

Lookup against regulated-entity app reference data with the date the data was last updated.

### 7. Zero Retention

No permanent storage of screenshots, numbers or identities beyond the temporary session.

---

## Inputs and Data Sources

The system is designed around:

- A labelled corpus of fraudulent and genuine messages across channels, with roughly half genuine to help the system learn what legitimate communication looks like.
- The Reserve Bank of India's published list of digital lending apps of regulated entities.
- Public guidance from the National Cybercrime Reporting Portal, the 1930 helpline and Reserve Bank consumer advisories.
- A post-incident procedure document validated by a relevant partner such as a police cyber cell, bank fraud team or consumer-rights organisation.

---

## Constraints

- **Advisory only:** no automatic reporting and no contact with banks or authorities on the user's behalf.
- **No retention:** no permanent storage of personal data.
- **Synthetic / redacted demo data:** demonstration inputs are synthetic or fully redacted.
- **Explainable assessments:** every assessment shows its reasons and sources.
- **Visible uncertainty:** the system states what it cannot establish.
- **No credential collection:** the system never advises sharing or requests OTPs, passwords, UPI PINs, CVVs or similar secrets.
- **No unsupported accusation:** a legitimate communication is never labelled fraudulent without stating the indicators found.

---

# 🧍 What This Problem Means in Real Life

### Imagine this.

You receive a message:

> **“Your bank KYC has expired. Update it within 10 minutes or your account will be blocked.”**

There is a link.

There is urgency.

There is fear.

And one question immediately comes to mind:

## **“Click karun ya nahi?”**

At that moment, a user does not need another long awareness article.

They need an answer.

```text
I received a message.
        ↓
Is it real?
        ↓
Should I click?
        ↓
Should I pay?
        ↓
Should I share anything?
        ↓
What if I already sent the money?
