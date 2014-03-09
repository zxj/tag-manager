var Start = function () {
    if (!MGR_INST) {
        WIN.YinTai_TagMgr = MGR_INST = new TagMananger();
        MGR_INST.injectTags();
    }
}

(function () {
    var
        doScroll = DOC.documentElement.doScroll || FALSE,
        triggerEvent = doScroll ? "onreadystatechange" : "DOMContentLoaded",
        readyChangeHandler,
        timer,
        nav = navigator,
        add = function (el, type, fn, capture) {
            if (el && el.addEventListener) {
                el.addEventListener(type, fn, capture);
            }
            else if (el && el.attachEvent) {
                el.attachEvent("on" + type, fn);
            }
        },
        remove = function (el, type, fn, capture) {
            if (el && el.removeEventListener) {
                try {
                    el.removeEventListener(type, fn, capture);
                }
                catch (ex) { }
            }
            else if (el && el.detachEvent) {
                el.detachEvent("on" + type, fn);
            }
        }
    ;

    UA_IE = Util.parseUA().ie;

    if (doScroll) {
        if (self !== self.top) {
            readyChangeHandler = function () {
                if (DOC.readyState == COMPLETE) {
                    READY = TRUE;
                    READY_HANDLER();
                    remove(DOC, triggerEvent, readyChangeHandler);
                }
            }
            add(DOC, triggerEvent, readyChangeHandler);
        }
        else {
            timer = setInterval(function () {
                try {
                    DOC.documentElement.doScroll("left");
                    clearInterval(timer);
                    timer = NULL;
                    READY = TRUE;
                    READY_HANDLER();
                }
                catch (domNotReady) {
                }
            }, 40);
        }
    }
    else {
        readyChangeHandler = function () {
            READY = TRUE;
            READY_HANDLER();
            remove(DOC, triggerEvent, readyChangeHandler);
        }
        add(DOC, triggerEvent, readyChangeHandler);
    }
}());

if ((DOC.readyState == INTERACTIVE && UA_IE == 0) || DOC.readyState == COMPLETE) {
    Start();
}