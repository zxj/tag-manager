TagManager
-------

TagManager是一个网页辅助内容管理工具，有条件的以异步的方式向页面嵌入辅助内容（广告内容、可执行JS代码、第三方统计代码等），在其中可以定义Tag的嵌入规则，规则由三部分组成宏、谓词、值。

（目前针对嵌入的Tag内容以及规则信息都是代码级别的，没有提供编辑界面）

##宏
宏即是规则比较的类型，比如：页面url，目前“宏”包含url、referrer、cookie、event四种类型。
####URL
根据页面url进行谓词判断，url的取值类型可以为单个url字符串，也可以为多个url组成的数组，值得明确的是该url不包含querystring，如当前页面url为http://www.yintai.com/search.aspx?keyword=test，进行比较的只有http://www.yintai.com/search.aspx。
####Referer
根据页面来源(referer头)进行谓词判断。
####Cookie
根据页面cookie进行判断，判断页面中是否有指定的cookie信息。
####Event
由客户端事件触发的类型。

##谓词
谓词是指比较的类型，目前提供的比较谓词有“等于”、“不等于”、“以开始”、“以结束”、“不以开始"、"不以结束"、“包含”、"不包含"。

####值
值的数据类型取决于”宏“，对照表如下：


