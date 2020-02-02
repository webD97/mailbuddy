import { connect, ImapSimple, getParts } from 'imap-simple';
import { Config as ImapConfig } from 'imap';
import { MailListener } from './MailListener';
import { Mail } from './Mail';

export class MailBuddy {
    private _imapConnection: ImapSimple;
    private _listeners: MailListener[];

    protected constructor(imapConnection: ImapSimple) {
        imapConnection.on('mail', this._onUpdateHandler.bind(this));
        this._imapConnection = imapConnection;
        this._listeners = [];

        this._onUpdateHandler();
    }

    public static async create(imapConfig: ImapConfig, boxName: string = 'INBOX') {
        console.debug(`Connecting to ${imapConfig.host}.`);
        const imapConnection = await connect({
            imap: imapConfig
        });

        console.debug(`Opening mailbox ${boxName}.`);
        await imapConnection.openBox(boxName);

        return new MailBuddy(imapConnection);
    }

    public shutdown() {
        console.debug(`Closing IMAP connection.`);
        this._imapConnection.end();
    }

    protected async _onUpdateHandler() {
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            markSeen: false,
            bodies: ['TEXT', 'HEADER'],
            struct: true
        };

        const searchResult = await this._imapConnection.search(searchCriteria, fetchOptions);

        const mail: Mail[] = await Promise.all(searchResult.map(async message => {
            const parts = getParts(message.attributes.struct!);

            return {
                headers: message.parts[1].body,
                bodies: (
                    await Promise.all(
                        parts.filter(part => part.partID.match(/^1\.\d*$/))
                            .map(async part => [
                                `${part.type}/${part.subtype}`,
                                await this._imapConnection.getPartData(message, part)
                            ])
                    ))
                    .reduce((current, next) => ({
                        ...current,
                        [next[0]]: next[1]
                    }), {}),
                attachments: await Promise.all(parts
                    .filter(part => part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')
                    .map(async part => ({
                        filename: part.disposition.params.filename,
                        data: await this._imapConnection.getPartData(message, part)
                    })))
            };
        }));

        this._listeners.forEach(listener => listener(mail));
    }

    public addListener(listener: MailListener) {
        this._listeners.push(listener);
    }
}
