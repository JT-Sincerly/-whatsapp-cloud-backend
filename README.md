# WhatsApp Cloud API backend

This starter provides:
- Meta webhook verification (`GET /webhook`)
- Incoming text message handling (`POST /webhook`)
- A basic automatic text reply
- A protected endpoint for sending a WhatsApp text notification (`POST /send-message`)

## Important
This is a backend service, not a public website. It does not need a separate front-end website. It must be deployed to a public HTTPS host before Meta can reach its webhook.

## Deploy
1. Put these files in a GitHub repository.
2. Deploy the repository to a Node.js host such as Render or Railway.
3. Set the environment variables from `.env.example` in the host's dashboard. Never commit `.env` or share your access token.
4. After deployment, copy the public HTTPS service URL, for example `https://your-service.example`.
5. In Meta Developers > WhatsApp > Configuration, set Callback URL to:
   `https://YOUR-HOST/webhook`
6. Set Verify Token to the exact value you used for `WEBHOOK_VERIFY_TOKEN`.
7. Click Verify and Save, then subscribe the webhook to the `messages` field.

## Meta values you need
From Meta Developers > WhatsApp > API Setup, copy:
- Temporary or permanent access token
- Phone Number ID (not the phone number itself)

Use a long random value for `WEBHOOK_VERIFY_TOKEN`. It is not the Meta access token.

## Send a notification
Send a POST request to `/send-message` with JSON:
`{"to":"2348012345678","message":"Your order has been confirmed."}`

Include header `x-api-secret` with the exact `API_SECRET` value. Use the recipient's international number without `+` or spaces.

## Notes
- The automatic reply currently responds to incoming text messages only.
- For the initial Meta test number, recipients generally need to be added as allowed test recipients.
- Business-initiated messages outside the customer service window require an approved WhatsApp message template.
- Do not expose the `/send-message` endpoint without its secret, and do not put access tokens in browser-side JavaScript.
- The `sendWhatsAppText` helper logs API errors in the host logs. Review those logs if Meta rejects a message.
