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
