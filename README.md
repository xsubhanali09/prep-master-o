# Prep Master

## Environment variables

Copy `.env.example` to `.env.local`:

```env
MONGODB_URI=your_mongodb_uri_here
MONGODB_DB=prep_master
OPENAI_API_KEY=your_openai_api_key_here

ADMIN_USERNAME=your_admin_username_here
ADMIN_PASSWORD=your_admin_password_here
ADMIN_GMAIL=your_admin_gmail_here
ADMIN_SECRET=your_long_random_admin_secret_here
```

`ADMIN_GMAIL` is kept server-side for admin/contact configuration. It is not a public user-account field.

**Never put real credentials in GitHub.** `.env.local` is ignored by `.gitignore`.

The admin API checks username + password + secret on the server. For a production launch, use a proper server-side session/authentication system rather than sending an admin password from a browser on every request.
