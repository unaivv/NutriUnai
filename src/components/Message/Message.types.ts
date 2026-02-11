export interface IMessage {
    sender: 'User' | 'System';
    text: string;
    plan?: 'unai' | 'marifeli' | 'both';
    planLabel?: string;
}