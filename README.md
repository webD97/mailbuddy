# MailBuddy
E-mail automation simplified.

## Example
```js
async function main() {
    const buddy = await MailBuddy.create({
        host: 'outlook.office365.com',
        user: '...',
        password: '...',
        port: 993,
        tls: true
    });

    buddy.addListener((mail) => {
        mail.filter(mail => mail.headers.from.includes('REWE eBon <ebon@mailing.rewe.de>'))
            .forEach(mail => console.log(mail));
    });
}

main().catch(console.error);
```
