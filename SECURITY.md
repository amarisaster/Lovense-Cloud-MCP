# 🛡️ Security & Privacy

Lovense Cloud is an MCP server for Lovense toy control, deployed on Cloudflare Workers. This integration handles **intimate hardware**—treat security with the highest priority.

---

## ⚠️ Sensitivity Notice

This MCP controls physical devices used in intimate contexts. Unauthorized access could be deeply violating. Take every security measure seriously.

---

## 🔑 Key Security Features

### Your Deployment, Your Devices

When you deploy Lovense Cloud, it runs on **your own** Cloudflare account, connecting to **your own** Lovense account. No shared servers, no shared access, no third parties.

> **What this means:** Your toy control flows from your AI companion → your Cloudflare worker → your Lovense account → your devices. Every link in that chain is yours.

### Token Security

Your Lovense authentication tokens are stored as **Cloudflare environment secrets**, encrypted and never exposed in code.

> **What this means:** Even if your code is public, your Lovense credentials are safe. No one can access your devices without your encrypted tokens.

### No Activity Logging

This MCP sends commands and receives status. It does **not** log, store, or track usage patterns, session history, or activity data.

> **What this means:** When you send a command, it executes and completes. There's no database of when, how often, or what settings you used. Your intimate activity remains private.

### Direct Communication

Commands go directly from your worker to Lovense's API. No intermediary servers, no proxies, no additional parties in the chain.

---

## 🔐 Best Practices (Non-Negotiable)

### Enable 2FA on EVERYTHING

| Platform | Why It Matters |
|----------|----------------|
| **Lovense Account** | Direct access to your device control |
| **Cloudflare** | Controls your worker deployment |
| **GitHub** | Protects your code if the repo is connected |
| **Email** | Recovery point for all other accounts |

This is not optional for this integration. Enable 2FA on every connected account.

### Use a Strong, Unique Password

Your Lovense account password should be:
- Unique (not used anywhere else)
- Strong (16+ characters, random)
- Stored in a password manager

### Review Connected Apps

Periodically check your Lovense account for authorized applications. Remove anything you don't recognize.

### Secure Your Network

When using this integration:
- Use trusted networks (not public WiFi)
- Consider a VPN for additional privacy
- Ensure your home network is secured

### Revoke Access Immediately if Compromised

If you suspect any credential exposure:
1. Change your Lovense password immediately
2. Regenerate Cloudflare API tokens
3. Rotate all environment secrets
4. Review account access logs

---

## 🚫 What This MCP Does NOT Do

- ❌ Store usage history or activity logs
- ❌ Share data with third parties
- ❌ Send analytics or telemetry
- ❌ Access your devices without your explicit command
- ❌ Maintain persistent connections when not in use

---

## 🔍 Transparency

This project is fully open source. You can audit every line of code. There are no hidden endpoints, no telemetry, no data collection.

Your body, your devices, your absolute control.
