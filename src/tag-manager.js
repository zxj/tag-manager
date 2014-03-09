var TagMananger = function () {
    var
    ruleMgr,
    tags = TAGS,
    events = {},
    /**
    * 将指定的tag插入到页面中
    *
    * @method _inject
    * @param {String} content tag content
    */
    _inject = function (content) {
        var
        scriptTag,
        body = DOC.body,
        tmpConTag = DOC.createElement("div"),
        srcName = "src",
        srcValue = "",
        trimReg = /^\s*|\s*$/g,
        annoReg = /\/\*.[^\/\*]*\*\//g,
        //            scriptReg = /<script[^>]+(?:src=('|")([^>]+)\1)?(?:[^<>]*)>([^<]*)<\/script>/g,
        //            scriptReg=/<script[^src]+(?:src=(?:'|")([^'"]+)[^\s>]*)?[^>]*>([^<]*)<\/script>/g,
        scriptReg = /<script(?:(?:[^>]+(?:src=(?:'|")([^'"]+)(?:'|"))[^>]*)|(?:[^>]*))>([^<]*)<\/script>/g,
        scriptTagReg = /^<script([^>]*)>(.*)<\/script>$/,
        scriptSrcReg = /.*?(?:src=(['|"])([^\1]+)\1)/,
        srcMatch,
        scriptMatch,
        fc;

        //过滤掉空格及js注释
        content = String(content).replace(trimReg, "").replace(annoReg, "");

        scriptMatch = scriptTagReg.exec(content);
        if (scriptMatch) {
            scriptTag = DOC.createElement("script");
            scriptTag.setAttribute("type", "text/javascript");
            srcMatch = scriptSrcReg.exec(scriptMatch[1]);//判断是否有src属性
            //[match string,'|",src]
            //如果src存在，则优先处理src
            if (srcMatch && srcMatch[2]) {
                scriptTag.setAttribute(srcName, srcMatch[2]);
                body.appendChild(scriptTag);
            }
            else if (Util.isString(scriptMatch[2]) && scriptMatch[2].replace(trimReg, "").length > 0) {
                scriptTag.text = scriptMatch[2];
                body.appendChild(scriptTag);
            }
            else {
                scriptTag = NULL;
            }

            //scriptMatch = scriptReg.exec(content);
            //while (scriptMatch) {
            //    if (scriptMatch[1] || scriptMatch[2]) {
            //        scriptTag = DOC.createElement("script");
            //        scriptTag.setAttribute("type", "text/javascript");
            //        //scriptMatch["匹配的所有内容","src属性值","脚本内容"]
            //        if (scriptMatch[1]) {
            //            scriptTag.setAttribute(srcName, scriptMatch[1]);
            //        }
            //        else {
            //            scriptTag.text = scriptMatch[2];
            //        }
            //        body.appendChild(scriptTag);
            //    }
            //    scriptMatch = scriptReg.exec(content);
            //}

            //过滤掉所有script内容，将剩余内容作为普通节点插入到
            //content = content.replace(scriptReg, "");
        }
        else {

            tmpConTag.innerHTML = content;

            fc = tmpConTag.firstChild;
            while (fc) {
                body.appendChild(fc);
                fc = tmpConTag.firstChild;
            }
            tmpConTag = null;
        }
    },
    /**
    * 获取指定tag的内容
    *
    * @method _getTag
    * @param {String} tagName 
    */
    _getTag = function (tagName) {
        var
        tagKey,
        tag,
        result = "";

        for (tagKey in tags) {
            if (tags.hasOwnProperty(tagKey)) {
                if (tagName === tagKey) {
                    result = tags[tagKey].value;
                    break;
                }
            }
        }

        return result;
    },
    /**
    * 将Tags.TagNames中的所有tag嵌入到页面中
    *
    * @method _injectTags
    */
    _injectTags = function () {
        var
        tagKey,
        tag;

        for (tagKey in tags) {
            if (tags.hasOwnProperty(tagKey)) {
                if (ruleMgr.verifyRule(tagKey)) {
                    tag = tags[tagKey];
                    _injectTag(tag);

                }
            }
        }
    },
    _injectTag = function (tag) {
        if (typeof tag.fn === "function") {
            tag.fn.apply(tag);
        };
        _inject(tag.value);
    },
    /**
    * 注册时间
    *
    * @method _regEvent
    * @param {String} eventName 事件名称
    * @param {String} tagKey tag标识
    */
    _regEvent = function (eventName, tagKey) {
        events[eventName] = tagKey;
    },
    /**
    * 触发指定的事件，并执行指定事件对应的tag的嵌入操作
    *
    * @method _fire
    * @param {String} event 事件名称
    */
    _fire = function (event) {
        var tagKey = events[event];
        if (tagKey) {
            _injectTag(tags[tagKey]);
        }
    };

    var self = {
        tags: tags,
        injectTags: _injectTags,
        fire: _fire,
        regEvent: _regEvent
    }

    ruleMgr = new RuleManager(self);

    return self;
}