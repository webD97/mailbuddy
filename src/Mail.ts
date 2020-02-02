export type Mail = {
    headers: any,
    bodies: { [key: string]: string },
    attachments: { filename: string, data: any }[]
};
