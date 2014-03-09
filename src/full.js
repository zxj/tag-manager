/// <reference path="eva.js" />
/// <reference path="http://r.ytrss.com/rs/js/eva/1.0.3/eva.js" />

/*
* Tag 管理大模块，其中包含了Tag投放、规则处理及具体的Tag代码
*/

(function () {

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

    /**
    * 工具类
    */
    var Util = {
        /**
        * 解析客户端cookie
        *
        * @method _parseCookie
        * @return {Object} {cookieName:cookieValue}
        */
        _parseCookie: function () {
            var result = {},
                rawCookie = DOC.cookie,
                parse = rawCookie.split(/;\s/g),
                cookieReg = /([^=]+)=([^;]*)/i,
                cookieName = NULL,
                cookieValue = NULL,
                cookieNameValue = NULL,
                i;


            if (rawCookie) {
                for (i = 0; i < parse[ATTR_LENGTH]; i++) {
                    cookieNameValue = parse[i].match(cookieReg);
                    if (cookieNameValue) {
                        cookieName = DECODE(cookieNameValue[1]);
                        cookieValue = DECODE(cookieNameValue[2]);
                    }
                    else {
                        cookieName = DECODE(parse[i]);
                        cookieValue = "";
                    }

                    result[cookieName] = cookieValue;
                }
            }
            return result;
        },
        _parseCookieSub: function (txt) {
            var hashParts = txt.split("&"),
                hashPart = NULL,
                i = 0,
                hash = {};

            for (i = 0; i < hashParts[ATTR_LENGTH]; i++) {
                hashPart = hashParts[i].split("=");
                hash[DECODE(hashPart[0])] = DECODE(hashPart[1]);
            }

            return hash;
        },
        /**
        * 获取cookie
        *
        * @method getCookie
        * @param {String} name
        * @return {Null | String} 存在则返回指定Cookie的值，否则返回null
        */
        getCookie: function (name) {
            var result = name ? this._parseCookie()[name] : NULL;
            return result || NULL;
        },
        getSubCookie: function (name, subName) {
            if (name && subName) {
                var hash = this._parseCookie()[name],
                    subValue;
                if (hash != NULL) {
                    subValue = this._parseCookieSub(hash)[subName];
                    if (subValue) {
                        return subValue;
                    }
                }

            }
            return NULL;
        },
        /**
        * 判断是否为String类型
        *
        * @method isString
        * @param {Any} value
        * @return {Boolean} 
        */
        isString: function (value) {
            return typeof value == STRING;
        },
        /**
        * 判断是否为Object类型
        *
        * @method isObject
        * @param {Any} value
        * @return {Boolean} 
        */
        isObject: function (value) {
            return value instanceof Object;
        },
        /**
        * 判断指定的两个值的类型是否相同
        *
        * @method typeEqual
        * @param {Any} a
        * @param {Any} b
        * @return {Boolean} 
        */
        typeEqual: function (a, b) {
            return typeof a == typeof b;
        },
        /**
        * 判断指定参数是否为数组
        *
        * @method isArray
        * @param {Any} value
        * @return {Boolean} 
        */
        isArray: function (value) {
            return value instanceof Array;
        },
        /**
        * 复制一个Obj对象
        *
        * @method clone
        * @param {Object} obj
        * @return {Object} 
        */
        clone: function (obj) {
            var destObj = {};
            for (var item in obj) {
                destObj[item] = obj[item];
            }
            return destObj;
        },
        /**
        * 数组遍历操作
        * @method each
        * @param {Array} 遍历的数组
        * @param {Function} 遍历处理函数
        * @param {Object} 遍历函数执行上下文，默认为window
        */
        each: function (arr, fn, context) {
            var nat = Array.prototype;

            arr = arr || [];
            context = context || WIN;

            if (nat.forEach) {
                nat.forEach.call(arr, fn, context);
            }
            else {
                for (var i = 0, len = (arr && arr[ATTR_LENGTH]) || 0; i < len; i++) {
                    fn.call(context, arr[i], i, arr);
                }
            }
        },
        /**
        * 数据合并操作
        * @method merge
        * @param {Object} objects* 一个或多个需要合并的对象
        */
        merge: function () {
            var result = {},
                obj,
                item,
                i = 0;

            for (i = 0; i < arguments[ATTR_LENGTH]; i++) {
                obj = arguments[i];
                for (item in obj) {
                    if (obj.hasOwnProperty(item)) {
                        result[item] = obj[item];
                    }
                }
            }

            return result;
        },
        /**
        * userAgent解析
        * @method parseUA
        * @return {ie:"6",gecko:"3.5",safari:"",chrome:"",opera:""}
        */
        parseUA: function () {

            var o = {
                ie: 0,
                webkit: 0,
                safari: 0,
                opera: 0,
                gecko: 0
            },
                self = this,
                ua = WIN.navigator.userAgent,
                m,
                numberify = function (s) {
                    var c = 0;
                    return parseFloat(s.replace(/\./g, function () {
                        return (c++ === 1) ? '' : '.';
                    }));
                };

            //如果已经解析过则直接返回
            if (self._UA) {
                return self._UA;
            }

            if (ua) {
                m = ua.match(/AppleWebKit\/([^\s]*)/);
                if (m && m[1]) {
                    o.webkit = numberify(m[1]);
                    o.safari = o.webkit;
                }
                m = ua.match(/OPR\/(\d+\.\d+)/);
                if (m && m[1]) {
                    // Opera 15+ with Blink (pretends to be both Chrome and Safari)
                    o.opera = numberify(m[1]);
                } else {
                    m = ua.match(/(Chrome|CrMo|CriOS)\/([^\s]*)/);

                    if (m && m[1] && m[2]) {
                        o.chrome = numberify(m[2]); // Chrome
                        o.safari = 0; //Reset safari back to 0
                    }
                }

                if (!o.webkit) {
                    if (/Opera/.test(ua)) {
                        m = ua.match(/Opera[\s\/]([^\s]*)/);
                        if (m && m[1]) {
                            o.opera = numberify(m[1]);
                        }
                        m = ua.match(/Version\/([^\s]*)/);
                        if (m && m[1]) {
                            o.opera = numberify(m[1]); // opera 10+
                        }
                    }
                    else {

                        m = ua.match(/MSIE ([^;]*)|Trident.*; rv:([0-9.]+)/);

                        if (m && (m[1] || m[2])) {
                            o.ie = numberify(m[1] || m[2]);
                        } else { // not opera, webkit, or ie
                            m = ua.match(/Gecko\/([^\s]*)/);

                            if (m) {
                                o.gecko = 1; // Gecko detected, look for revision
                                m = ua.match(/rv:([^\s\)]*)/);
                                if (m && m[1]) {
                                    o.gecko = numberify(m[1]);
                                }
                            }
                        }

                    }
                }
            }

            self._UA = o;

            return o;

        }
    }

    //公共规则
    var RULES = {
        //url 以www.yintai开始匹配的规则
        sWithWWW: {
            macro: MACROS.url,
            verb: VERBS.sWith,
            value: "http://www.yintai"
        },
        //url 以channel.yintai开始的规则
        sWithChannel: {
            macro: MACROS.url,
            verb: VERBS.sWith,
            value: "http://channel.yintai"
        },
        sWithItem: {
            macro: MACROS.url,
            verb: VERBS.include,
            value: [
                "http://detail.yintai",
                "http://item.yintai"
            ]
        },
        inCom: {
            macro: MACROS.url,
            verb: VERBS.include,
            value: [".yintai.com", ".yintai.ts2", ".yintai.pre"]
        },
        orderSucc: {
            macro: MACROS.url,
            verb: VERBS.include,
            value: [
                "/mycheckout/OnlinePayment.aspx",
                "/mycheckout/OnlinePaySucess.aspx",
                "/mycheckout/OrderSucess.aspx",
                "/mycheckout/PartPaySucess.aspx"
            ]
        },
        GWC: {
            macro: MACROS.url,
            verb: VERBS.include,
            value: [
                "http://cart.yintai.com",
                "/mycheckout/shoppingcart.aspx"
            ]
        },
        inMy: {
            macro: MACROS.url,
            verb: VERBS.include,
            value: [
                "http://my.yintai",
                "http://home.yintai"
            ]
        },

        IE7: {
            macro: MACROS.ua,
            verb: VERBS.equal,
            value: "ie#7"
        }
    }
    var TAGS = {
        //"ab":{
        //    value:'<script type="text/javascript">(function(){try{if(typeof(YT_AB)=="undefined"){return}else{if(typeof(YT_AB.ID)!="string"||typeof(YT_AB.VBP)!="number"||typeof(YT_AB.URLS)!="object"){return}else{if(YT_AB.URLS.length>0){for(var d=YT_AB.URLS.length-1;d>=0;d--){var l=/^(https:\\\/\\\/|http:\\\/\\\/)?([a-zA-Z0-9])+\.yintai\.com/;if(!l.exec(YT_AB.URLS[d].burl)){return}}}}}}catch(f){return}var a=window.location.href;var g="abid="+YT_AB.ID+"&abv=";var q="A";var o=false;var j=function(t){var u=0;for(var s=0;s<t.length;s++){u=u+parseInt(t.substring(s,s+1))}return(u%10)+""};var e=function(i,u){if(i==null){o=true;return"A"}else{if(typeof(u)=="undefined"||typeof(parseInt(i))!="number"){return"A"}else{if(u>=100){return"A"}else{var s=j(i.substring(15,25)).concat(j(i.substring(25,35)));var t=parseInt(s);if(t>=0&&t<=u-1){return"B"}else{return"A"}}}}};var m=function(i,s){var t=/\\\?([a-zA-Z0-9])+=/;if(t.exec(i)){return i+"&"+s}else{return i+"?"+s}};var h=function(){var u=encodeURIComponent("lk__guid")+"=",i=document.cookie.indexOf(u),t=null;if(i>-1){var s=document.cookie.indexOf(";",i);if(s==-1){s=document.cookie.length}t=decodeURIComponent(document.cookie.substring(i+u.length,s))}return t};var c=function(i){var s=i;if(s.indexOf("http://")==-1){s="http://"+i}return s};var k=function(){if(YT_AB.URLS.length>0){var w=document.getElementsByTagName("a");for(var s=YT_AB.URLS.length-1;s>=0;s--){var x=c(YT_AB.URLS[s].aurl);var u=c(YT_AB.URLS[s].burl);for(var v=w.length-1;v>=0;v--){if(o&&p==null&&(w[v].href==x||w[v].href==x+"/")){r(u,w[v]);continue}if(q=="B"&&(w[v].href==x||w[v].href==x+"/")){w[v].href=m(u,g+q)}else{if(q=="A"&&(w[v].href==x||w[v].href==x+"/")){w[v].href=m(w[v].href,g+q)}}}}}else{return}};var r=function(i,s){n(s,"mousedown",function(t){if(p==null){p=h()}if(!t){t=window.event}var u=t.target||t.srcElement;if(u.getAttribute("href")!=null){href=u.getAttribute("href");q=e(p,YT_AB.VBP);if(q=="B"){u.href=m(i,g+q)}else{u.href=m(href,g+q)}}return true})};var n=function(s,t,i){if(s.addEventListener){s.addEventListener(t,i,false)}else{if(s.attachEvent){s.attachEvent("on"+t,i)}else{s["on"+t]=i}}};var p=h();if(a!=""){var b=a.indexOf("&abv=");if(b>-1){q=a.substr(b+5,1)}else{q=e(p,YT_AB.VBP)}}else{q=e(p,YT_AB.VBP)}k()})();<\/script>',
        //    rules:
        //    {
        //        allowRules:
        //        [
        //            {
        //                macro:MACROS.url,
        //                verb:VERBS.equal,
        //                value:WILDCARD
        //            }
        //        ]
        //    }
        //},
        //搜狐统计
        "zyz": {
            value: "<script type=\"text/javascript\"> var $OptAim_zyzs = document.getElementsByTagName(\'script\')[0]; var $OptAim_i = document.createElement(\'iframe\'); $OptAim_i.src = \"http://cm.optaim.com/i\"; $OptAim_i.async = true; $OptAim_i.style.display = \"none\"; $OptAim_zyzs.parentNode.insertBefore($OptAim_i, $OptAim_zyzs); var $OptAim_zaq = $OptAim_zaq || []; $OptAim_zaq.push([\'setTrackerUrl\', \'http://tk.optaim.com/j\']); $OptAim_zaq.push([\'setSiteId\', \'yintai\']); $OptAim_zaq.push([\'trackPageView\']); var $OptAim_s = document.createElement(\'script\'); $OptAim_s.src = \"http://r.ytrss.com/rs/js/coop/zyztk201302-min.js\"; $OptAim_s.type = \'text/javascript\'; $OptAim_s.async = true; $OptAim_zyzs.parentNode.insertBefore($OptAim_s, $OptAim_zyzs);<\/script>",
            rules:
            {
                allowRules:
                [
                    RULES.sWithWWW,
                    RULES.sWithChannel,
                    RULES.sWithItem
                ],
                denyRules:
                [
                    {
                        macro: MACROS.ua,
                        verb: VERBS.equal,
                        value: WILDCARD
                    },
                    RULES.IE7
                ]
            }
        }
        //紫博蓝普通页面PV统计
        , "lk_pv": {
            value: "<script type=\"text/javascript\">var $lk_cmds = [];$lk_cmds.push([\'setSiteId\', \'Y8CG26ZF\']);$lk_cmds.push([\'trackPageView\']);(function() { var _lk = document.createElement(\'script\'); _lk.type = \'text/javascript\'; _lk.async = true; _lk.src = \'http://r.ytrss.com/rs/js/coop/lk_t_yintai-min.js\'; var _lk_s = document.getElementsByTagName(\'script\')[0]; _lk_s.parentNode.insertBefore(_lk, _lk_s);}());<\/script>",
            rules:
            {
                allowRules:
                [
                    RULES.inCom
                ],
                denyRules:
                [
                    RULES.orderSucc,
                    RULES.inMy,
                    RULES.IE7
                ]
            }
        }
        //紫博蓝订单统计信息
         , "lk_ods": {
             value: "<script type=\"text/javascript\">(function() { var _lk = document.createElement(\'script\'); _lk.type = \'text/javascript\'; _lk.async = true; _lk.src = \'http://r.ytrss.com/rs/js/coop/lk_t_yintai-min.js\'; var _lk_s = document.getElementsByTagName(\'script\')[0]; _lk_s.parentNode.insertBefore(_lk, _lk_s);}());<\/script>",
             rules:
            {
                allowRules:
                [
                    Util.merge(Util.clone(RULES.orderSucc), {
                        and: {
                            macro: MACROS.cookie,
                            verb: VERBS.include,
                            value: [
                                { source: "zblbd" },
                                { source: "zblpz" },
                                { source: "zblwm" },
                                { source: "zbljj" },
                                { source: "zblbdzj" },
                                { source: "zblwmzj" },
                            ]
                        }
                    })
                    //Util.clone(RULES.orderSucc).and= {
                    //        macro: MACROS.cookie,
                    //        verb: VERBS.include,
                    //        value: [
                    //            { source: "zblbd" },
                    //            { source: "zblpz" },
                    //            { source: "zblwm" },
                    //            { source: "zbljj" },
                    //            { source: "zblbdzj" },
                    //            { source: "zblwmzj" },
                    //        ]
                    //    }

                ],
                denyRules:
                [
                    RULES.IE7
                ]
            },
             fn: function () {
                 var $lk_cmds = [],
                    orders = YinTai_TagData.orders,
                    order = orders ? orders[0] : NULL,
                    prods = YinTai_TagData.prods,
                    i;

                 $lk_cmds.push(['setSiteId', 'Y8CG26ZF']);
                 $lk_cmds.push(['addTransaction', order.id, order.source, order.amount, "", order.shipping, "", order.city, order.state, ""]);
                 for (i = 0; i < prods[ATTR_LENGTH]; i++) {
                     $lk_cmds.push(['addTransactionLineItem', order.id, prods[i].sku, prods[i].name, prods[i].cate[0].tit, prods[i].price, prods[i].quantity]);
                 }
                 $lk_cmds.push(['trackTransaction']);

                 WIN.$lk_cmds = $lk_cmds;
             }
         },
        "baidu": {
            value: "<script>var _hmt = _hmt || [];(function() {var hm = document.createElement(\"script\");hm.src = \"//hm.baidu.com/hm.js?de21a9fe270e08ded96c90b71e185e9a\";var s = document.getElementsByTagName(\"script\")[0]; s.parentNode.insertBefore(hm, s);})();<\/script>",
            rules:
            {
                allowRules:
                [
                    RULES.inCom
                ],
                denyRules:
                [
                    RULES.inMy,
                    RULES.IE7
                ]
            }
        },
        "bfd": {
            value: "<script type=\"text/javascript\">window[\"$BFD\"] = window[\"$BFD\"] || {};$BFD.client_id = \"" + ((location.hostname.indexOf("yintai.com") > -1) ? "Cyintai" : "Ctest_yintai") + "\";$BFD.script = document.createElement(\"script\");$BFD.script.type = \"text/javascript\";$BFD.script.async = true;$BFD.script.charset = \"utf-8\";$BFD.script.src = 'http://r.ytrss.com/rs/js/coop/bfd-min@2013110501.js';document.getElementsByTagName(\"head\")[0].appendChild($BFD.script);<\/script>",
            rules:
            {
                allowRules:
                [
                    RULES.sWithItem,
                    RULES.orderSucc,
                    RULES.inMy,
                    {
                        macro: MACROS.url,
                        verb: VERBS.include,
                        value: [
                            "/product/search.aspx"
                        ]
                    }.and = RULES.GWC,
                    {
                        macro: MACROS.event,
                        verb: VERBS.equal,
                        value: "bfd404"
                    }
                ],
                denyRules:
                [
                    RULES.IE7
                ]
            },
            fn: function () {
                var i = 0,
                    category = [],
                    cateItem,
                    userID = Util.getSubCookie("Yt_ct", "OId"),
                    prods = YinTai_TagData.prods || [],
                    prod = prods[0],
                    orders = (YinTai_TagData.orders || [])[0],
                    page = YinTai_TagData.page || {},
                    prodsMeta = YinTai_TagData.prodsMeta || {},
                    pageID = page.id,
                    cateIDs = [],
                    hostname = location.hostname,
                    pathname = location.pathname.toLowerCase(),
                    pageTypeDetail = "detail",
                    pageTypeOrder = "order",
                    pageTypePayment = "payment",
                    pageTypeSearch = "search",
                    pageTypeAccount = "account",
                    pageTypeWrong = "wrong",
                    pageTypeShopcart = "shopcart",
                    dataInfo = {},
                    cnxhLabel = "猜你喜欢",
                    rqtjLabel = "人气推荐",
                    queryTag = "",
                    getPageType = function () {
                        var pageType = "";

                        pageType = (hostname.indexOf("item.yintai") > -1) ? pageTypeDetail ://详情页
                            (pathname.indexOf("shoppingcart.aspx") > -1 || hostname.indexOf("cart.yintai") > -1) ? pageTypeShopcart ://购物车
                            (pathname.indexOf("onlinepayment.aspx") > -1 || pathname.indexOf("ordersucess.aspx") > -1) ? pageTypeOrder ://订单成功页
                            (pathname.indexOf("partpaysucess.aspx") > -1 || pathname.indexOf("onlinepaysucess.aspx") > -1) ? pageTypePayment ://支付成功页
                            (pathname.indexOf("search.aspx") > -1) ? pageTypeSearch ://搜索页
                            (hostname.indexOf("my.yintai") > -1 || hostname.indexOf("home.yintai") > -1) ? pageTypeAccount ://用户中心
                            (pageID == "102") ? pageTypeWrong : "";//404页面，在部分404页面显示的时候当前url并未发生改变，该处是通过“点击流”设定的pageID进行判定

                        return pageType;
                    },
                    getCartItem = function () {
                        var result = [];
                        Util.each(prods, function (item) {
                            result.push([item.sku, -1, -1]);
                        });
                        return result;
                    },
                    getOrderItem = function () {
                        var result = [];
                        Util.each(orders.skus, function (sku) {
                            result.push([sku, -1, -1]);
                        });
                        return result;
                    },
                    pageType = getPageType();

                userID = !userID ? 0 : userID;

                window["$BFD"] = window["$BFD"] || {};

                dataInfo = {
                    user_id: userID,
                    page_type: pageType
                };
                if (pageType == pageTypeDetail && prod) {

                    for (i = 0; i < prod.cate[ATTR_LENGTH]; i++) {
                        cateItem = prod.cate[i];
                        category.push([cateItem.tit, cateItem.href]);
                        cateIDs.push(cateItem.id);
                    }

                    dataInfo = Util.merge(dataInfo, {
                        id: prod.sku,
                        name: prod.name,
                        link: location.href,
                        image_link: prod.imgSrc,
                        price: prod.price,
                        market_price: prod.mPrice,
                        category: category,
                        categroy_id: cateIDs,
                        brand: prod.brand.tit,
                        brand_id: prod.brand.id,
                        end_time: "",
                        onsale: prod.onsale,
                        stock: prod.stock > 0 ? 1 : 0,
                        gcolor_id: prod.colorID,
                        gstyle_id: prod.styleID
                    });
                }
                else if (pageType == pageTypeShopcart) {
                    dataInfo = Util.merge(dataInfo, {
                        cart_items: getCartItem()
                    });
                }
                else if (pageType == pageTypeOrder || pageType == pageTypePayment) {
                    dataInfo = Util.merge(dataInfo, {
                        order_id: orders.id,
                        order_items: getOrderItem(),
                        total: -1
                    });
                }
                else if (pageType == pageTypeSearch) {
                    dataInfo = Util.merge(dataInfo, {
                        search_word: prodsMeta.keywords[0],
                        search_result: (!isNaN(parseInt(prodsMeta.searchCount)) && prodsMeta.searchCount > 0) ? 1 : 0
                    });
                }

                window["$BFD"].BFD_INFO = dataInfo;

                if (pageType == pageTypeDetail) {
                    //推荐信息回调
                    $BFD.showRecVAV = function (data) {
                        var productDetailPageInst = S.Pages.ProductDetail.instance;

                        queryTag = "bfd_a";

                        productDetailPageInst && productDetailPageInst.bfdRecommend &&
                            productDetailPageInst.bfdRecommend({ label: "看了又看", prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.dt_vav);

                    }
                    $BFD.showRecBAB = function (data) {
                        var productDetailPageInst = S.Pages.ProductDetail.instance;

                        queryTag = "bfd_b";

                        productDetailPageInst && productDetailPageInst.bfdRecommend &&
                            productDetailPageInst.bfdRecommend({ label: "买了又买", prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.dt_bab);

                    }
                    $BFD.showRecFBT = function (data) {
                        var productDetailPageInst = S.Pages.ProductDetail.instance;

                        queryTag = "bfd_c";

                        productDetailPageInst && productDetailPageInst.bfdRecommend &&
                            productDetailPageInst.bfdRecommend({ label: "人气推荐", prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.dt_fbt);
                    }
                }
                else if (pageType == pageTypeSearch) {
                    //搜索无结果页
                    $BFD.showSRRecByVH = function (data) {

                        var pageInst = S.Pages.productSearch;

                        queryTag = "bfd_f";

                        pageInst && pageInst.bfdRecommend && pageInst.bfdRecommend({ label: cnxhLabel, prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.sr_ah);
                    }
                }
                else if (pageType == pageTypeAccount) {
                    //用户中心
                    $BFD.showAPRecByAH = function (data) {
                        var pageInst = S.Pages.homeIndex;

                        queryTag = "bfd_e";

                        pageInst && pageInst.bfdRecommend && pageInst.bfdRecommend({ label: cnxhLabel, prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.ap_ah);
                    }
                }
                else if (pageType == pageTypeWrong) {
                    //404
                    $BFD.showWGRecByAH = function (data) {
                        queryTag = "bfd_g";

                        WIN.renderRecommend && WIN.renderRecommend({ label: cnxhLabel, prods: data, queryTag: "", queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.wg_ah);
                    }
                    $BFD.showWGRecByVH = function (data) {

                        queryTag = "bfd_d";

                        WIN.renderRecommend && WIN.renderRecommend({ label: rqtjLabel, prods: data, queryTag: queryTag });

                        $BFD_Core.exts.BannerShow.prototype.push(DOC.getElementById("J_BFD_" + queryTag), $BFD.bid.wg_vh);
                    }
                }

                //var data = [
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色百搭水洗修身牛仔短裤V110107010301，S",
                //            img: "http://p10.ytrss.com/product/20/310/4611/ViewImage/19414.jpg",
                //            price: "142",
                //            mkpr:"569"
                //        },
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色廓形修身款百搭哈伦裤V110407019301，S",
                //            img: "http://p10.ytrss.com/product/20/310/4691/ViewImage/9575.jpg",
                //            price: "142",
                //            mkpr:"569"
                //        },
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色百搭水洗修身牛仔短裤V110107010301，S",
                //            img: "http://p10.ytrss.com/product/20/301/8038/ViewImage/58038.jpg",
                //            price: "100",
                //            mkpr:"200"
                //        },
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色百搭水洗修身牛仔短裤V110107010301，S",
                //            img: "http://p10.ytrss.com/product/20/310/4675/ViewImage/57306.jpg",
                //            price: "655",
                //            mkpr:"955"
                //        },
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色百搭水洗修身牛仔短裤V110107010301，S",
                //            img: "http://p10.ytrss.com/product/20/310/4611/ViewImage/19414.jpg",
                //            price: "142",
                //            mkpr:"569 "
                //        },
                //        {
                //            url: "http://item.yintai.com/20-310-4611C.html?from=yttj_a",
                //            name: "VIFILLE 13Q2蓝色百搭水洗修身牛仔短裤V110107010301，S",
                //            img: "http://p10.ytrss.com/product/20/301/8041/ViewImage/59958.jpg",
                //            price: "1420",
                //            mkpr:"569 "
                //        }
                //    ]

                //    setTimeout(function () {
                //        //$BFD.showWGRecByAH(data);
                //        //$BFD.showWGRecByVH(data);
                //        $BFD.showSRRecByVH(data);
                //    }, 2000);
            }
        },
        //品友访客找回技术
        "py": {
            value: "<script type=\"text/javascript\">!function(d){(function(){var s=d.createElement(\"script\");d.body.insertBefore(s,d.body.firstChild);s.src=\"http://r.ytrss.com/rs/js/coop/fk_13_1658_1-min.js\";})()}(document)</script>",
            rules: {
                allowRules: [
                    RULES.sWithChannel,                         //频道页
                    RULES.sWithItem,                            //详情页，特卖详情
                    {                                           //首页
                        macro: MACROS.url,
                        verb: VERBS.equal,
                        value: "http://www.yintai.com/"
                    },
                    {
                        macro: MACROS.url,
                        verb: VERBS.include,
                        value: [
                            "http://www.yintai.com/?",          //首页
                            "http://temai.yintai"               //特卖，特卖列表
                        ]
                    },
                    {
                        macro: MACROS.url,
                        verb: VERBS.include,
                        value: [
                            "/channel/",                        //频道页
                            "/product/list-",                   //列表页
                            "/mycheckout/checkout.aspx",        //订单提交
                            "/product/search.aspx",             //搜索
                            "/customer/login.aspx"              //登陆
                        ]
                    }.and = RULES.GWC
                ],
                denyRules:
                [
                    RULES.IE7
                ]
            }

        },
        //vizury技术统计代码更新
        "vizury": {
            value: "<script type=\"text/javascript\">(function() { try { var viz = document.createElement(\"script\"); viz.type = \"text/javascript\"; viz.async = true; viz.src = (\"https:\" == document.location.protocol ?\"https://ssl.vizury.com\" : \"http://serv3.vizury.com\")+ \"/analyze/pixel.php?account_id=VIZVRM224\"; var s = document.getElementsByTagName(\"script\")[0]; s.parentNode.insertBefore(viz, s); viz.onload = function() { try { pixel.parse(); } catch (i) { } }; viz.onreadystatechange = function() { if (viz.readyState == \"complete\" || viz.readyState == \"loaded\") { try { pixel.parse(); } catch (i) { } } }; } catch (i) { }})();<\/script>",
            rules: {
                allowRules: [
                    RULES.sWithChannel,                         //频道页
                    RULES.sWithItem,                            //详情页，特卖详情
                    {
                        macro: MACROS.url,
                        verb: VERBS.include,
                        value: [
                                    "http://www.yintai.com/",
                                    "/product/list-",                       //列表页
                                    "/product/search.aspx"                 //搜索
                        ]
                    }.and = RULES.GWC
                ],
                denyRules:
                [
                    RULES.IE7
                ]
            }

        },
        //vizury技术统计代码更新—订单成功页
        "vizuryorder": {
            value: "<script type=\"text/javascript\">function create() { try { var baseURL = \"http://serv3.vizury.com/analyze/analyze.php?account_id=VIZVRM224&param=e500&{dataPartial}&currency=&section=1&level=1\"; var analyze = document.createElement(\"iframe\"); analyze.src = baseURL; analyze.scrolling = \"no\"; analyze.width = 1; analyze.height = 1; analyze.marginheight = 0; analyze.marginwidth = 0; analyze.frameborder = 0; var node = document.getElementsByTagName(\"script\")[0]; node.parentNode.insertBefore(analyze, node); } catch (i) { }}var existing = window.onload;window.onload = function() { if (existing) { existing(); } create();}<\/script>",
            rules: {
                allowRules: [
                    RULES.orderSucc
                ],
                denyRules:
                [
                    RULES.IE7
                ]
            },
            fn: function () {
                var self = this,
                    vizOrders = YinTai_TagData.orders || [],
                    vizProds = YinTai_TagData.prods || [],
                    vizOrderId = vizOrders[0] ? vizOrders[0].id : '',
                    vizAmount = vizOrders[0] ? vizOrders[0].amount : '',
                    vizOrderUrlParams = ''

                ;

                for (j = 0; j < vizProds[ATTR_LENGTH]; j++) {
                    vizOrderUrlParams += '&pid' + (j + 1) + '=' + vizProds[j].sku + '&catid' + (j + 1) + '=' + vizProds[j].cate[0].id + '&quantity' + (j + 1) + '=' + vizProds[j].quantity + '&price' + (j + 1) + '=' + vizProds[j].price;
                }

                self.value = self.value.replace("{dataPartial}", 'orderid=' + vizOrderId + '&orderprice=' + vizAmount + vizOrderUrlParams);

            }
        }

        //, "test": {
        //    value: "<script>var tmpDiv=document.createElement('div');tmpDiv.style.width='50px';tmpDiv.style.height='50px';tmpDiv.style.position='absolute';tmpDiv.style.top='0px';tmpDiv.style.left='0px';tmpDiv.style.zIndex='10000';tmpDiv.style.border='red solid 1px';document.body.appendChild(tmpDiv);<\/script>",
        //    rules:
        //    {
        //        allowRules:
        //        [
        //            {
        //                macro: MACROS.cookie,
        //                verb: VERBS.include,
        //                value: [{ name: 1 }, { name: 2}]
        //            },
        //            {
        //                macro: MACROS.ua,
        //                verb: VERBS.equal,
        //                value: "ie#7"
        //            }
        //        ]
        //    }
        //}
    };
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

    /**
    * 规则管理器
    *
    * @constructor RuleManager
    * @param {TagManager} tagManager tagManager实例
    */
    var RuleManager = function (tagManager) {
        var
        tagMgr = tagManager,
        /**
        * 验证指定的代码是否符合当前运行时的规则
        * 
        * 验证规则：
        *   1、禁止规则优先级高于允许规则
        *   2、在禁止规则条件失败时，有一个允许规则通过，则意味着通过
        */
        _verifyRule = function (tagName) {
            return _verifyAllow(tagName) && !_verifyDeny(tagName);
        },
        /**
        * 验证允许规则
        *
        * @method _verifyAllow
        * @param {String} tagName
        * @return {Boolean} true则表示满足允许规则
        */
        _verifyAllow = function (tagName) {
            var
            rules = tagMgr.tags[tagName].rules.allowRules,
            i = 0,
            result = FALSE,
            len = 0;

            //如果不存在任何允许规则，则意味着禁止
            if (!rules) {
                return result;
            }

            len = rules[ATTR_LENGTH];

            for (; i < len; i++) {
                if (rules[i].macro == MACROS.event) {
                    tagMgr.regEvent(rules[i].value, tagName);
                    result = FALSE;
                }
                else {
                    result = _analyRule(rules[i]);
                }
                //有一个验证通过，则意味着allow
                if (result) {
                    break;
                }

            }

            return result;
        },
        /**
        * 验证禁止规则
        * 
        * @method _verifyDeny
        * @param {String} tagName 
        * @return {Boolean} true则表示满足禁止规则
        */
        _verifyDeny = function (tagName) {
            var
            rules = tagMgr.tags[tagName].rules.denyRules,
            i = 0,
            result = FALSE,
            len = 0;

            if (!rules) {
                return result;
            }

            len = rules[ATTR_LENGTH];

            for (; i < len; i++) {
                result = _analyRule(rules[i]);
                //有一个为true，则表明符合deny条件
                if (result) {
                    break;
                }
            }

            return result;
        },
        /**
        * 恒等计算
        *
        * @method _equalCal
        * @param {String} ruleValue
        * @param {String} compareValue
        * @param {String} macro
        * @return {Boolean}
        */
        _equalCal = function (ruleValue, compareValue, macro) {
            var result = FALSE,
                item,
                arr;

            if (macro == MACROS.ua) {
                // ie#0 chrome#32.0 etc.
                for (item in compareValue) {
                    if (compareValue.hasOwnProperty(item)) {
                        if (item + "#" + compareValue[item] == ruleValue) {
                            result = TRUE;
                            break;
                        }
                    }
                }

            }
            else {
                result = ruleValue === compareValue;
            }
            return result;
        },
        /**
        * 以开始比较
        *
        * @method _eWithCal
        * @param {String} withValue 被比较的参数
        * @param {String} compareValue 进行比较的参数
        * @return {Boolean}
        */
        _eWithCal = function (withValue, compareValue) {
            //只支持字符串的处理
            if (!Util.isString(withValue)) {
                withValue = String(withValue);
            }
            if (!Util.isString(compareValue)) {
                compareValue = String(compareValue);
            }
            return new RegExp("\.*" + withValue + "$").test(compareValue);
        },
        /**
        * 以结束计算方法
        *
        * @method _sWithCal
        * @param {String} withValue 被比较的参数
        * @param {String} compareValue 进行比较的参数
        * @return {Boolean}
        */
        _sWithCal = function (withValue, compareValue) {
            //只支持字符串的处理
            if (!Util.isString(withValue)) {
                withValue = String(withValue);
            }
            if (!Util.isString(compareValue)) {
                compareValue = String(compareValue);
            }
            return new RegExp("^" + withValue + "\.*").test(compareValue);
        },
        /**
        * 判断被计算的参数中是否包含指定进行比较的参数
        *
        * @method _includeCal
        * @param {String | Object} withValue 被计算的参数
        * @param {String | Object} compareValue 进行比较的参数
        * @return {Boolean}
        */
        _includeCal = function (withValue, compareValue) {
            var result = FALSE,
                item,
                i;
            if (Util.isArray(withValue)) {
                for (i = 0; i < withValue[ATTR_LENGTH]; i++) {
                    //withValue的值类型仅支持Object和String两种，且withValue的类型和compareValue的类型相同时才进行进一步的比较
                    if ((Util.isObject(withValue[i]) || Util.isString(withValue[i])) && Util.typeEqual(withValue[i], compareValue)) {
                        if (Util.isObject(withValue[i])) {
                            for (item in withValue[i]) {
                                if (withValue[i].hasOwnProperty(item)) {
                                    if (compareValue[item] && compareValue[item] == withValue[i][item]) {
                                        result = TRUE;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            result = new RegExp("\.*" + withValue[i] + "\.*").test(compareValue);
                        }
                    }
                    if (result) {
                        break;
                    }
                }
            }
            else if (Util.isString(withValue)) {
                result = new RegExp("\.*" + withValue + "\.*").test(compareValue);
            }

            return result;
        },
        /**
        * 验证具体的规则
        *
        * @method _analyRule
        * @param {Object} rule 规则JSON对象
        * @return {Boolean} 满足规则则返回true，否则为false
        */
        _analyRule = function (rule) {
            var
                self = this,
                curUrl = location.href,
                refer = DOC.referrer.toLowerCase(),
                compareValue,
                cookieName,
                ruleValueKey,
                ruleValue = rule.value,
                ruleMacro = rule.macro,
                result = FALSE,
                index,
                i;

            if (!rule) {
                return FALSE;
            }

            //url判断是否区分大小写
            if (CONF.iCase && (ruleMacro == MACROS.url || ruleMacro == MACROS.refer)) {
                curUrl = curUrl.toLowerCase();
                refer = refer.toLowerCase();
                if (Util.isArray(ruleValue)) {
                    for (i = 0; i < ruleValue[ATTR_LENGTH]; i++) {
                        ruleValue[i] = String(ruleValue[i]).toLowerCase();
                    }
                }
                else {
                    ruleValue = String(ruleValue).toLowerCase(); //url的比较不区分大小写
                }
            }

            switch (ruleMacro) {
                case MACROS.url:
                    index = curUrl.indexOf("?");
                    compareValue = index == -1 ? curUrl : curUrl.substr(0, curUrl.indexOf("?"));
                    if (ruleValue == WILDCARD) {
                        ruleValue = compareValue;
                    }
                    break;
                case MACROS.refer:
                    compareValue = refer;
                    if (ruleValue === WILDCARD) {
                        ruleValue = refer;
                    }
                    break;
                case MACROS.cookie:
                    compareValue = Util._parseCookie();
                    break;
                case MACROS.ua:
                    compareValue = Util.parseUA();
                    ruleValue = String(ruleValue).toLowerCase();
                    break;
            }

            switch (rule.verb) {
                case VERBS.equal:
                    result = _equalCal(ruleValue, compareValue, ruleMacro);
                    break;
                case VERBS.eWith:
                    result = _eWithCal(ruleValue, compareValue);
                    break;
                case VERBS.nEWith:
                    result = !_eWithCal(ruleValue, compareValue);
                    break;
                case VERBS.sWith:
                    result = _sWithCal(ruleValue, compareValue);
                    break;
                case VERBS.nSWith:
                    result = !_sWithCal(ruleValue, compareValue);
                    break;
                case VERBS.nEqual:
                    result = !_equalCal(ruleValue, compareValue);
                    break;
                case VERBS.include:
                    result = _includeCal(ruleValue, compareValue);
                    break;
                case VERBS.nInclude:
                    result = !_includeCal(ruleValue, compareValue);
                    break;
            }
            //如果存在“与”操作，且当前result为真
            if (rule[ATTR_AND] && result) {
                result = _analyRule.call(self, rule[ATTR_AND]);
            }
            return result;
        };

        if (tagManager) {
            return {
                verifyRule: _verifyRule
            }
        }
    }

    /**
    * Tag管理器
    *
    * @constructor TagManager
    */
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

    /**
    * 入口
    * 
    * @method Start
    */
    var Start = function () {
        //IE7浏览器中禁止所有统计代码
        if (!MGR_INST) {
            WIN.YinTai_TagMgr = MGR_INST = new TagMananger();
            MGR_INST.injectTags();
        }
    }

    // YinTai_TagData see http://eip.yintai.org:8888/confluence/display/UIHTML/YinTai_TagData
    WIN.YinTai_TagData = WIN.YinTai_TagData || {};
    //console.log(DOC.readyState);
    //console.log(UA_IE);
    if ((DOC.readyState == INTERACTIVE && UA_IE == 0) || DOC.readyState == COMPLETE) {
        Start();
    }
}());
