export const send = (message, data) => {
    const msg = {type: message};

    if (data)
        msg.data = data;

    window.parent.postMessage(msg, '*');
}

export const listen = (eventName, listener) => {
    window.addEventListener('message', (event) => {
        const {type, data} = event.data;

        // only call listener if type is present
        if (type && type === eventName)
            listener(data);
    }, false);
}
