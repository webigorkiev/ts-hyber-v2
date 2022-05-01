import fetch from "cross-fetch";
import {channel} from "diagnostic_channel";

export namespace hyber {
    export interface Options {
        entry?: string,
        entryStatus?: string,

        // Basic auth
        login: string,
        pw: string,

        // client id
        id: string,

        // default alpha name
        alpha?: string,

        // Default ttl
        ttl?:number,

        ctr?: boolean,

        channels?: channels[]
    }
    export type channels = "push"|"viber"|"sms"|"whatsapp";
    export type device = "phone"|"all";
    export interface Request {
        phone_number: string,
        extra_id?: string,
        callback_url?: string,
        start_time?: string,
        tag?: string,
        division_code?: string,
        channels?: channels[],
        text?: string,
        channel_options?: {
            push?: Push,
            viber?: Viber,
            sms?: Sms,
            whatsapp?: Whatsapp,
        }
    }
    export interface Response {
        message_id: string,
        phone_number:string,
        extra_id:string,
        job_id:string,
        processed: boolean,
        accepted: boolean
    }
    export interface HyberError extends Error{
        code?: number;
        constructor(message?:string, code?:number): HyberError;
    }
    export interface Notification {
        text?: string,
        ttl?: number,
        ctr?: boolean
        [key: string]: any
    }
    export interface Push extends Notification {
        title?:string,
        device?: device,
        img?:string,
        caption?:string,
        action?: string,
    }
    export interface Viber extends Notification  {
        device?: device,
        img?:string,
        caption?:string,
        action?: string,
        file_name?:string
    }
    export interface Sms extends Notification  {
        alpha_name?: string
    }
    export interface Whatsapp extends Notification  {
        img_name?:string,
        doc?:string,
        doc_name?:string,
        audio?:string,
        video?:string,
        video_name?:string,
        latitude?:number, // -90 <-> 90
        longitude?:number // -180 <-> 180
    }
    export interface SentInfo {
        number: number,
        time: number,
        status: number,
        substatus: number,
        hyber_status: 23011,
        message_id: string,
        extra_id: string,
        sent_via: string,
        total_sms_parts: number,
        delivered_sms_parts: number
    }
    export interface SentInfoSimple {
        phone_number: string,
        last_partner: string,
        message_id: string,
        extra_id: string,
        time: number,
        status: number,
        substatus: number,
        hyber_status: number,
        total_sms_parts: number,
        delivered_sms_parts: number,
        clicks: number
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
        entry: "https://api-v2.hyber.im",
        entryStatus: "https://dr-v2.hyber.im",
        ttl: 60,
        ctr: false,
        channels: ["sms"]
    }
    private opts: Required<hyber.Options>;

    constructor(options: hyber.Options) {
        this.opts = Object.assign({}, this.defaultOpts, options) as Required<hyber.Options>;
    }

    /**
     * Send single notification multichannel, v2 api
     * @param params
     */
    public async send(params:hyber.Request): Promise<hyber.Response> {
        const {body} = await this.fetch(
            `${this.opts.entry}/${this.opts.id}`,
            this.addDefaultsChannelOptions(params)
        );
        return {...(body || {})};
    }

    /**
     * Request simple status by notification id
     * @param id
     */
    public async status(id: string): Promise<hyber.SentInfoSimple> {
        const {body} = await this.fetch(
            `${this.opts.entryStatus}/${this.opts.id}/api/dr/${id}/simple`,
            {},
            "get"
        );
        return {...(body || {})};
    }

    /**
     * Request simple status by notification external id
     * @param id
     */
    public async statusExternal(id: string): Promise<hyber.SentInfoSimple> {
        const {body} = await this.fetch(
            `${this.opts.entryStatus}/${this.opts.id}/api/dr/external/${id}/simple`,
            {},
            "get"
        );
        return {...(body || {})};
    }
    private async fetch(url: string, params: Record<string, any> = {}, method = "post") {
        method = method.toLowerCase();
        const urlObj = new URL(url);
        method === "get" && (urlObj.search = new URLSearchParams(params).toString());

        const response = await fetch(urlObj.toString(), {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from(`${this.opts.login}:${this.opts.pw}`, "binary").toString("base64")
            },
            ...(method === "get" ? {} : {body: JSON.stringify(params)}),
            method
        });
        const body = await response.json();
        if(!response.ok) {
            throw new HyberError(
                "Api hyber: " + (body.error_text || response.statusText) + ", code: " + (body.error_code || response.status),
                response.status
            );
        }
        if(body.error_code) {
            throw new HyberError(body.error_text, body.error_code);
        }
        return {response, body};
    }
    private addDefaultsChannelOptions(params: hyber.Request): hyber.Request {
        params.channels = params.channels || this.opts.channels;

        if(!params.channel_options) {
            params.channel_options = {} as Record<hyber.channels, hyber.Notification>;
            params.channels.map((channel) => (params.channel_options as Record<string, any>)[channel] = {});
        }
        params.channel_options = Object.fromEntries(
            Object.entries(params.channel_options).map(([key, opts] : [hyber.channels, hyber.Notification]) => {
                opts.text = (opts.text || params.text) as string;
                opts.ttl = opts.ttl ?? this.opts.ttl;
                opts.ctr = opts.ctr ?? this.opts.ctr;
                if(key === "sms") {
                    opts.alpha_name = opts.alpha_name || this.opts.alpha;
                }
                return [key, opts];
            })
        );
        delete params.text;

        return params;
    }
}

export const hyber = (opts: hyber.Options) => new Hyber(opts);