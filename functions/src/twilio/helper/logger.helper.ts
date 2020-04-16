export enum LogLevel {
    INFO = "info",
    ERROR = "error",
}

export const logger = (phoneNumber: string, responseId: string, msg: string, extra: any = '', logLevel: LogLevel = LogLevel.INFO) => {
    switch (logLevel) {
        case LogLevel.INFO:
            console.log(`[PHONE_NUMBER ${phoneNumber} # ID ${responseId}]`, msg, extra);
            break;

        case LogLevel.ERROR:
            console.error(`[PHONE_NUMBER ${phoneNumber} # ID ${responseId}]`, msg, extra);
            break;
    }
};
