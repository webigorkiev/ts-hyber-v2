import fetch from "cross-fetch";

export namespace hyber {
    export interface Options {
        entry?: string,

        // Basic auth
        login: string,
        pw: string,

        // client id
        id: string,

        // default alpha name
        alpha?: string
    }
    type channels = "push"|"viber"|"sms"|"whatsapp";
    export interface Request {
        phone_number: string,
        extra_id?: string,
        callback_url?: string,
        start_time?: string,
        tag?: string,
        division_code?: string,
        channels: channels[],
        channel_options: {
            push?: {},
            viber?: {},
            sms?: {},
            whatsapp?: {},
        }
    }
    export interface Response {
        message_id: string
    }
    export interface HyberError extends Error{
        code?: number;
        constructor(message?:string, code?:number): HyberError;
    }

}
class HyberError extends Error {
    public code?: number;
    constructor(message?:string, code?:number) {
        super();
        this.message = message|| "";
        this.code = code;
    }
}
class Hyber {
    private defaultOpts: Omit<hyber.Options, "login" | "pw" | "id" | "alpha"> = {
        entry: "https://api-v2.hyber.im"
    }
    private opts: hyber.Options;

    constructor(options: hyber.Options) {
        this.opts = Object.assign({}, this.defaultOpts, options);
    }

    /**
     * Send single notification multichannel, v2 api
     * @param params
     */
    public async send(params:hyber.Request): Promise<hyber.Response> {
        const {body} = await this.fetch(`${this.opts.entry}/${this.opts.id}`, params);
        return {...(body || {})};
    }

    private async fetch(url: string, params: Record<string, any> = {}) {
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
                "authorization": "Basic " + Buffer.from(`${this.opts.login}:${this.opts.pw}`).toString("base64")
            },
            body: JSON.stringify(params),
            method: "post"
        });
        const body = await response.json();
        if(!response.ok) {
            throw new HyberError("Api hyber request error", response.status);
        }
        if(body.error_code) {
            throw new HyberError(body.error_text, body.error_code);
        }
        return {response, body};
    }
}

export const hyber = (opts: hyber.Options) => new Hyber(opts);