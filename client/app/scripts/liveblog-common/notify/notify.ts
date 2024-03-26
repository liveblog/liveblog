import type { ITimeoutService, IScope } from 'angular';
import notifyTemplate from 'scripts/liveblog-common/notify/views/notify.ng1';

interface Message {
    id: string;
    type: string;
    msg: string;
    options: object;
}

class NotifyService {
    private $timeout: ITimeoutService;
    private gettext: Function;

    private savingMessageId: string | null = null;
    private ttls: { [key: string]: number } = {
        info: 3000,
        success: 3000,
        warning: 5000,
        error: 8000,
    };

    public messages: Message[] = [];

    constructor($timeout: ITimeoutService, gettext: Function) {
        this.$timeout = $timeout;
        this.gettext = gettext;
    }

    private generateId(): string {
        return Math.random().toString(36)
            .substr(2, 9);
    }

    private addMessageGeneric = (type: string, msg: string, ttl?: number, options: object = {}): string => {
        // prevent adding the same message more than once
        const existingMsg = this.messages.find((message) => message.msg === msg);

        if (existingMsg)
            return existingMsg.id;

        const id = this.generateId();
        const expiry = ttl ?? this.ttls[type];

        this.messages.push({ id, type, msg, options });

        if (expiry) {
            this.$timeout(() => {
                this.removeById(id);
            }, expiry);
        }

        return id;
    }

    public removeById = (id: string) => {
        const index = this.messages.findIndex((message) => message.id === id);

        if (index !== -1) {
            this.messages.splice(index, 1);
        }
    }

    public info = (text: string, ttl?: number, options: object = {}) => {
        return this.addMessageGeneric('info', text, ttl, options);
    }

    public success = (text: string, ttl?: number, options: object = {}) => {
        return this.addMessageGeneric('success', text, ttl, options);
    }

    public warning = (text: string, ttl?: number, options: object = {}) => {
        return this.addMessageGeneric('warning', text, ttl, options);
    }

    public error = (text: string, ttl?: number, options: object = {}) => {
        return this.addMessageGeneric('error', text, ttl, options);
    }

    public startSaving = () => {
        this.savingMessageId = this.addMessageGeneric('info', this.gettext('Saving...'));
    }

    public stopSaving = () => {
        if (this.savingMessageId) {
            this.removeById(this.savingMessageId);
            this.savingMessageId = null;
        }
    }
}

angular.module('superdesk.core.notify', ['superdesk.core.translate'])
    .service('notify', ['$timeout', 'gettext', NotifyService])
    .directive('sdNotify', ['notify', function(notify: NotifyService) {
        return {
            scope: true,
            templateUrl: notifyTemplate,
            link: function(scope: IScope | any) {
                scope.messages = notify.messages;
                scope.notify = notify;
            },
        };
    }]);
