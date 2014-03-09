(function(){
	var
        WILDCARD = "*",

        WIN = window,
        DOC = document,

        TRUE = true,
        FALSE = false,
        NULL = null,
        STRING = "string",
        UNDEFINED = "undefined",

        ATTR_LENGTH = "length",
        ATTR_AND = "and",

        COMPLETE = "complete",
        INTERACTIVE = "interactive",

        READY = FALSE,
    //domready handler
        READY_HANDLER = function () {
            Start();
        },

        UA_IE = 0,

        CONF = {
            iCase: TRUE //是否区分大小写
        },

        MACROS = {
            url: "url",
            refer: "refer",
            cookie: "cookie",
            event: "event",
            ua: "ua"
        },

        DECODE = decodeURIComponent,

        VERBS = {
            equal: "=", //等于
            nEqual: "!=", //不等于
            gThen: ">", //大于
            lThen: "<", //小于
            sWith: "*!", //前缀为
            eWith: "!*", //后缀为
            nSWith: "*!!", //不以XX为前缀
            nEWith: "!!*", //不以XX为后缀
            include: "!*!", //包含
            nInclude: "!!*!!"//不包含
        },

        /*
        * IE7浏览器的MACROS.ua对应的value值
        * 该值的格式为"浏览器简写#版本号"，如：ie#7表示IE7浏览器，chrome#31.0表示chrome31.0版，#可以省略
        */
        UA_IE7 = "ie#7",

        MGR_INST = NULL;
	
	/*@content@*/
}())