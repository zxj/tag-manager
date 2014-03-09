##TagManager

TagManager是一个网页辅助内容管理工具，通过定义`规则`有条件的以异步的方式向页面嵌入辅助内容(广告内容、可执行JS代码等)。
规则由三部分组成`宏`、`谓词`、`值`。

##宏
`宏`即是规则比较的类型，比如：页面url，目前`宏`包含`url`,`referrer`,`cookie`,`event`四种类型。

###url
根据页面url进行谓词判断，url的取值类型可以为单个url字符串，也可以为多个url组成的数组，值得明确的是该url不包含querystring，如当前页面url为http://www.yintai.com/search.aspx?keyword=test，进行比较的只有http://www.yintai.com/search.aspx。

###referer
根据页面来源(referer头)进行谓词判断。url中包含`query`信息

###cookie
根据页面cookie进行判断，判断页面中是否有指定的cookie信息。

###event
由客户端事件触发的类型，为自定义事件。通常用于`依赖于上下文异步触发嵌入操作`的使用场景。

###ua
标识运行页面的浏览器类型，可选值为`ie`、`gecko`、`webkit`、`opera`、`safari`，可以通过`#`标识浏览器版本，如：ie#6

##谓词
谓词是指比较的类型，目前提供的比较谓词有`等于`,`不等于`,`以开始`,`以结束`,`不以开始`,`不以结束`,`包含`,`不包含`。

##值
条件比较的具体内容。值的数据类型取决于`宏`，对照表如下：

<table>
	<tr>
		<th width="100">宏</th>
		<th>数据类型</th>
	</tr>
	<tr>
		<td>url</td>
		<td>string | [string]</td>
	</tr>
	<tr>
		<td>referrer</td>
		<td>string | [string]</td>
	</tr>
	<tr>
		<td>cookie</td>
		<td>[{cookieName:cookieValue}]</td>
	</tr>
	<tr>
		<td>event</td>
		<td>string</td>
	</tr>
	<tr>
		<td>ua</td>
		<td>string</td>
	</tr>
</table>



##规则
规则分两种类型 `允许规则`,`禁止规则`

* 每种规则都可以有多条，规则与规则之间是`逻辑或`关系；
* 可以通过为每条规则增加`and`操作实现`逻辑与`关系;
* 如果两种规则同时成立禁止规则优先;
* 如果有一条允许规则成立则表示代码`允许`嵌入;
* 一个Tag如果没有任何允许规则，则始终不会被嵌入到页面;

规则由`宏`、`谓词`、`值`组成，示例如下：
```javascript
{
	macro:MACROS.url,
	verb:VERBS.equal,
	value:"http://www.yintai.com"
}
```

##Tag
Tag由`key`,`value`,`rules`,`fn`四个属性组成，其中`fn`为可选属性。

* `key`-名称标识，比如：google_conversion标识google再营销代码;
* `value`-内容字符串，可以为任意html标签;
* `rules` - 嵌入规则，包含`allowRule`、`denyRule`两个字段，每个允许或禁止规则都是一个数组，数组内容为规则代码；
* `fn` - 回调方法，在tag内容被嵌入到页面之前调用，可以在此方法中执行一些数据准备操作；

`rules`代码示例如下：
```javascript
rule:{
	allowRules:[
		{
			macro:MACROS.url,
			verb:VERBS.equal,
			value:"http://www.yintai.com"
		},
		{
			macro:MACROS.url,
			verb:VERBS.equal,
			value:"http://www.baidu.com",
			//逻辑与条件，可以逐级扩展
			and:{
				macro:MACROS.referrer,
				verb:VERBS.equal,
				value:"http://www.google.com"
			}
		}
	],
	denyRules:[
		{
			macro:MACROS.url,
			verb:VERBS.equal,
			value:"http://www.sina.com"
		}
	]
}
```

##使用方式
将如下代码片段嵌入页面任意位置即可（建议放到`head`标签中）
```javascript
<script type="text/javascript">
        (function () {
            var script = document.createElement("script"),
                s = document.getElementsByTagName("script")[0];
            script.type = "text/javascript";
            script.asny = true;
            script.src = "js/tag-manager.js";
            s.parentNode.insertBefore(script, s);
        } ());
</script>
```