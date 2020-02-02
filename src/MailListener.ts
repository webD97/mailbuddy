import { Mail } from "./Mail";

export type MailListener = (mails: Mail[]) => void;
