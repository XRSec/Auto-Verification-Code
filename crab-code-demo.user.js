// ==UserScript==
// @name         万能验证码自动输入（升级版）
// @namespace    https://www.like996.icu:1205/
// @version      3.0
// @description  在将来的时间里将会在后台默默的为你自动识别页面是否存在验证码并填入。对于一些书写不规整的验证码页面请手动配置规则。感谢老六提供基础代码
// @author       crab
// @match        http://*/*
// @match        https://*/*
// @connect      like996.icu
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @nocompat     Chrome
// ==/UserScript==
class CaptchaWrite {

    IdCard() {
        return Set["idCard"];
    }
    getCaptchaServerUrl(){
        return "https://www.like996.icu:1205/";
    }
    constructor() {
        this.Tip = this.AddTip();
        if (GM_listValues().indexOf("set") == -1) {
            GM_setValue("set", {
                "idCard": ""
            });
            var WhetherHelp = confirm("万能验证码填入\n初始化完毕!\n在将来的时间里将会在后台默默的为你\n自动识别页面是否存在验证码并填入。\n对于一些书写不规整的验证码页面请手动添加规则。\n查看添加方法请点击确定。");
            if (WhetherHelp == true) {
                GM_openInTab(this.getCaptchaServerUrl() + "help.html", 'active')
            }
        }

        Set = GM_getValue("set");
        // 设置自动识别初始值
        if(Set["autoIdentification"] == undefined ){
            Set["autoIdentification"]="true";
            GM_setValue("set", Set);
        }

        // 设置开启提示初始值
        if(Set["showHintCheck"] == undefined ){
            Set["showHintCheck"]="true";
            GM_setValue("set", Set);
        }

        // 设置开启提示音初始值
        if(Set["warningTone"] == undefined ){
            Set["warningTone"]="true";
            GM_setValue("set", Set);
        }

        // 设置崩溃后自动拉黑网站初始值
        if(Set["autoBlackList"] == undefined ){
            Set["autoBlackList"]="false";
            GM_setValue("set", Set);
        }
    }

    //手动添加规则
    PickUp() {
        var that = this;
        var AddRule = {};
        var IdentifyResult = '';
        that.Hint('请对验证码图片点击右键！')
        $("img").each(function() {
            $(this).on("contextmenu", function() {

                var img = that.Aimed($(this));
                console.log('PickUp_Img:' + img);
                if($(img).length!=1){
                    that.Hint('验证码选择错误，该图片实际对应多个元素。')
                    return;
                }

                that.Hint('等待识别')
                IdentifyResult = that.Identify(img,function ManualRule(img,IdentifyResult){
                    if (img && IdentifyResult) {
                        console.log('记录信息' + img + IdentifyResult);
                        AddRule['img'] = img;
                        $("img").each(function() {
                            $(this).off("click");
                            $(this).off("on");
                            $(this).off("load");
                        });
                        that.Hint('接下来请点击验证码输入框')
                        $("input").each(function() {
                            $(this).click(function() {
                                var input = that.Aimed($(this));
                                // console.log('PickUp_input' + input);
                                AddRule['input'] = input;
                                AddRule['path'] = window.location.href;
                                AddRule['title'] = document.title;
                                AddRule['host'] = window.location.host;
                                AddRule['idcard'] = that.IdCard();
                                that.Write(IdentifyResult,input);
                                that.Hint('完成')
                                //移除事件
                                $("input").each(function() {
                                    $(this).off("click");
                                });
                                //添加信息
                                that.Query({
                                    "method": "captchaHostAdd",
                                    "data": AddRule
                                },function(data){writeResultIntervals[writeResultIntervals.length]={"img":img,"input":input}});
                                that.delCapFoowwLocalStorage(window.location.host);
                            });
                        });
                    }
                });


            });
        });
    }
    //创建提示元素
    AddTip() {
        var TipHtml = $("<div id='like996_identification'></div>").text("Text.");
        TipHtml.css({
            "background-color": "rgba(211,211,211,0.86)",
            "align-items": "center",
            "justify-content": "center",
            "position": "fixed",
            "color": "black",
            "top": "-5em",
            "height": "2em",
            "margin": "0em",
            "padding": "0em",
            "font-size": "1.2em",
            "width": "100%",
            "left": "0",
            "right": "0",
            "text-align": "center",
            "z-index": "9999999999999",
            "padding-top": "3px",
            display: 'none'

        });
        $("body").prepend(TipHtml);
        return TipHtml;
    }
    //展示提醒
    Hint(Content, Duration) {
        if(Set["showHintCheck"]!="true"){
           return;
        }
        var that = this;

        that.Tip.stop(true, false).animate({
            top: '-5em'
        }, 300, function() {
            if(Set["warningTone"]=="true"){
               Content += that.doWarningTone(Content)
            }
            Content += "<span style='color:red;float: right;margin-right: 20px;' onclick='document.getElementById(\"like996_identification\").remove()'>X</span>";
            that.Tip.show();
            that.Tip.html(Content);

        });
        that.Tip.animate({
            top: '0em'
        }, 500).animate({
            top: '0em'
        }, Duration ? Duration : 3000).animate({
            top: '-5em'
        }, 500, function() {
            that.Tip.hide();
        });
        return;
    }
    //查询规则
    Query(Json,callback) {
        var that = this;
        var QueryRule = '';
        var LocalStorageData=this.getCapFoowwLocalStorage(Json.method + "_" + Json.data.host);
        if(Json.method=='captchaHostAdd'){
            that.delCapFoowwLocalStorage("captchaHostQuery_"+Json.data.host);
            LocalStorageData=null;
        }
        if(LocalStorageData!=null){
            console.log("存在本地缓存的验证码识别规则直接使用。")
            if(callback!=null){
                callback(LocalStorageData);
                return;
            }else{
                return LocalStorageData;
            }
        }
        $.ajax({
            url: that.getCaptchaServerUrl() + Json.method,
            type: "POST",
            dateType: 'json',
            cache: false,
            async: callback!=null,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(Json.data),
            success: function(data) {
                if (data.info) {
                    that.Hint(data.info);
                }
                QueryRule = data;
                that.setCapFoowwLocalStorage(Json.method + "_" + Json.data.host,data,new Date().getTime()+1000*60)
                if(callback!=null){
                    callback(QueryRule);
                }

            },
            error: function(data) {
                console.log("error");
            }
        });
        return QueryRule;
    }
    //开始识别
    Start() {
        //检查配置中是否有此网站
        var that = this;
        var Pathname = window.location.href;
        var Card = that.IdCard()
        writeResultInterval= setInterval(function(){that.WriteResultsInterval();},500);
        that.Query({
            "method": "captchaHostQuery",
            "data": {
                "host": window.location.host,
                "path": Pathname,
                "idcard": Card
            }
        },function(Rule){
            if (Rule.code ==531 || Rule.code ==532) {
                console.log('有规则执行规则' + Pathname);
                var data=Rule.data;
                for(var i=0;i<data.length;i++){
                    writeResultIntervals[i]=data[i];
                }
                console.log('等待验证码图片出现');
            } else if (Rule.code == 530) {
                console.log('黑名单' + Pathname);
                that.Hint('该网站在黑名单中，无法识别，请联系客服进行处理。', 5000);
                return
            } else if (Rule.code == 533 && Set["autoIdentification"]=="true") {
                console.log('新网站开始自动化验证码查找' + Pathname);
                var MatchList = that.AutoRules();
                if (MatchList.length) {
                    console.log('检测到开始写入，并添加规则');
                    for (i in MatchList) {
                        console.log(MatchList[i].img, MatchList[i].input);
                        $(MatchList[i].img).bind("error",function(){
                           that.addBadWeb(MatchList[i].img,MatchList[i].input);
                        });
                        that.WriteResults(MatchList[i].img, MatchList[i].input)
                    }
                } else {
                }
            }
        });

    }
    // 定时执行绑定验证码img操作
    WriteResultsInterval(){
        for(var i=0;i< writeResultIntervals.length;i++){
            var imgAddr=writeResultIntervals[i].img;
            var inputAddr=writeResultIntervals[i].input;
            if(document.querySelector(imgAddr)==null||document.querySelector(inputAddr)==null){
                continue;
            }
            try{
                if(this.getCapFoowwLocalStorage("err_"+writeResultIntervals[i].img)==null){// 写入识别规则之前，先判断她是否有错误
                    this.WriteResults(imgAddr, inputAddr);
                }
            }catch(e){
               window.clearInterval(writeResultInterval);
               this.addBadWeb(imgAddr,inputAddr);
               return;
            }
        }
    }
    //解析
    Identify_Baidu(img,ImgBase,callback) {
        var that = this;
        var Base;
        try{
            Base = "img="+encodeURIComponent(ImgBase.toDataURL("image/png").replace(/.*,/, ""));
            // 丢弃小图片
            if(Base.length<255){
                return;
            }
        }catch(e){
            return;
        }
        var Results = that.getCapFoowwLocalStorage(Base.substring(Base.length-32));
        if(Results!=null){
            if(callback.name != 'ManualRule' ){// 不为手动直接返回结果
                 return Results;
            }
        }
        that.setCapFoowwLocalStorage(Base.substring(Base.length-32),"识别中..",new Date().getTime()+(9999999 * 9999999));//同一个验证码只识别一次
        var url=that.getCaptchaServerUrl() + "/hello";
        console.log("验证码变动，开始识别");
        GM_xmlhttpRequest({
             url: url,
             method: 'POST',
             headers: {'Content-Type': 'application/x-www-form-urlencoded','path' : window.location.href},
             data:  Base+"&idCard="+that.IdCard()+"&version=3.0",
             responseType: "json",
             onload: obj => {
                 var data=obj.response;
                 if (!data.valid) {
                    if(data.description!=undefined){
                        that.Hint('识别请求发生错误： ' + data.description, 5000);
                    }
                    that.setCapFoowwLocalStorage(Base.substring(Base.length-32),data.description,new Date().getTime()+(9999999 * 9999999))

                } else {
                    Results = data.data;
                    if (Results.length < 4) {
                        that.Hint('验证码识别结果可能错误，请刷新验证码尝试', 5000)
                    }else if(data.description != ''&& data.description != null){
                        that.Hint(data.description, data.showTime)
                    }else{
                        that.Hint('验证码识别完成', 500)
                    }
                    that.setCapFoowwLocalStorage(Base.substring(Base.length-32),Results,new Date().getTime()+(9999999 * 9999999))
                    if(callback!=null){
                        if(callback.name=='WriteRule'){
                            callback(Results);
                        }else if(callback.name=='ManualRule'){
                            callback(img,Results);
                        }
                    }
                }
             },onerror: err => {
                console.log(err)
             }
         });
        
        return Results;
    }
    //识别操作
    Identify(img,callback) {
        var that = this;
        var Base = that.ConversionBase(img);
        try{
            if(Base.toDataURL("image/png").replace(/.*,/, "").length<255){
                throw new Error("图片大小异常");
            }
        }catch(e){
            if(callback.name=='ManualRule'){
                that.Hint('跨域策略，请重新右键点击图片');
            }
            return;
        }
        if (Base.width) {
            if(!$(img).is(":visible")){
                console.log("验证码不可见，本次不识别");
                return;
            }
            that.Identify_Baidu(img,Base,callback);
        } else {
            console.log('验证码没有加载加载后自动识别');
            that.Hint('点击图片非验证码图片，或存在跨域问题')
        }
    }
    //根据配置识别写入
    WriteResults(img, input) {
        var that = this;
        //创建一个触发操作
        if(document.querySelector(img)==null){
            return;
        }
        document.querySelector(img).onload = function() {
            that.WriteResults(img, input)
        }
        this.Identify(img,function WriteRule(vcode){
            that.Write(vcode, input)
        })

    }
    //写入操作
    Write(ResultsImg, WriteInput) {
        var that = this;
        WriteInput = document.querySelector(WriteInput);
        WriteInput.value = ResultsImg;
        if(typeof(InputEvent)!=='undefined') {
            //使用 InputEvent 方法，主流浏览器兼容
            WriteInput.value=ResultsImg;
            WriteInput.dispatchEvent(new InputEvent("input")); //模拟事件
            that.fire(WriteInput,"change");
            that.fire(WriteInput,"blur");
            that.fire(WriteInput,"focus");
            that.fire(WriteInput,"keypress");
            that.fire(WriteInput,"keydown");
            that.fire(WriteInput,"keyup");
            that.fire(WriteInput,"select");
            WriteInput.value = ResultsImg;
        } else if(KeyboardEvent) {
            //使用 KeyboardEvent 方法，ES6以下的浏览器方法
            WriteInput.dispatchEvent(new KeyboardEvent("input"));
        }
    }
    // 各类事件
    fire(element,eventName){
        var event = document.createEvent("HTMLEvents");
        event.initEvent(eventName, true, true);
        element.dispatchEvent(event);
    }
    //转换图片
    ConversionBase(img) {
        img = document.querySelector(img);
        img.setAttribute("crossOrigin",'Anonymous');// 设置允许跨域
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return canvas;
    }
    //自动规则
    AutoRules() {
        var that = this;
        var MatchList = [];
        $("img").each(function() {
            var Randomcolor = "red";
            if ($(this).siblings("input").length == 1) {
                MatchList.push({
                    "img": that.Aimed($(this)),
                    "input": that.Aimed($(this).siblings("input"))
                })
                $(this).css("borderStyle", "solid").css("borderColor", Randomcolor).css("border-width", "4px");
                $(this).siblings("input").css("borderStyle", "solid").css("borderColor", Randomcolor);
            } else {
                if ($(this).prev().children("input").length == 1) {
                    MatchList.push({
                        "img": that.Aimed($(this)),
                        "input": that.Aimed($(this).prev().children("input"))
                    })
                    $(this).css("borderStyle", "solid").css("borderColor", Randomcolor).css("border-width", "4px");
                    $(this).prev().children("input").css("borderStyle", "solid").css("borderColor", Randomcolor);
                }
                if ($(this).next().children("input").length == 1) {
                    MatchList.push({
                        "img": that.Aimed($(this)),
                        "input": that.Aimed($(this).next().children("input"))
                    })
                    $(this).css("borderStyle", "solid").css("borderColor", Randomcolor).css("border-width", "4px");
                    $(this).next().children("input").css("borderStyle", "solid").css("borderColor", Randomcolor);
                }
            }
        });
        return MatchList;
    }
    //生成标识
    Aimed(Element) {
        // console.log('---根据元素创建配置信息---');
        Element = Element[0]
        var that = this;
        var ElementLocalName = Element.localName;
        var result;
        // 如果有vue的id，则直接返回
        var vueId=that.getDataV(Element);
        if(vueId != null){
            result = ElementLocalName+"["+vueId+"]";
            if( $(result).length == 1){
                return result;
            }
        }
        // 如果有placeholder，则直接返回
        var placeholder=that.getPlaceholder(Element);
        if(placeholder != null){
            result = ElementLocalName+"["+placeholder+"]";
             if( $(result).length == 1){
                return result;
            }
        }
        // 如果有alt，则直接返回
        var alt=that.getAlt(Element);
        if(alt != null){
            result = ElementLocalName+"["+alt+"]";
             if( $(result).length == 1){
                return result;
            }
        }

        // 如果有name且只有一个，则直接返回
        var selectElement=that.getElementName(Element);
        if(selectElement != null){
            return selectElement;
        }

        // 如果有src，且src后面无参数则直接返回
        var src=that.getSrc(Element);
        if(src != null && src.length<200){
            result = ElementLocalName+"["+src+"]";
             if( $(result).length == 1){
                return result;
            }
        }
        // 如果有onClick则直接返回
        var onClick=that.getOnClick(Element);
        if(onClick != null && onClick.length<200){
            result = ElementLocalName+"["+onClick+"]";
             if( $(result).length == 1){
                return result;
            }
        }

        var Symbol = ( this.getElementId(Element)  ? "#" :Element.className ? "." : false);
        var locationAddr;
        if (!Symbol) {
            locationAddr= that.Climb(Element.parentNode, ElementLocalName);
        } else {
            locationAddr= that.Climb(Element, ElementLocalName);
        }
        if($(locationAddr).length==1){
            return locationAddr.trim();
        }
        that.Hint('该网站非标准web结构，暂时无法添加规则，请联系客服添加。')
        return null;

    }
    //判断元素id是否可信
    getElementId(element){
        var id=element.id;
        if(id){
            if(id.indexOf("exifviewer-img-")==-1){// 对抗类似vue这种无意义id
                if(id.length<40){// 对抗某些会自动变换id的验证码
                    return true;
                }
            }
        }
        return false;
    }

    //爬层级
    Climb(Element, ElementLocalName, Joint = '') {
        var ElementType = (this.getElementId(Element)  ? Element.id : Element.className ? Element.className.replace(/\s/g, ".") : false);
        var Symbol = (this.getElementId(Element) ? "#" : Element.className ? "." : false);
        var Address ;
        if (ElementType && ElementLocalName == Element.localName) {
            Address = ElementLocalName + Symbol + ElementType;
        } else {
            Address ="";
            if(Symbol!=false){
                Address=Address+Symbol;
            }
            if(ElementType!=false){
                Address=Address+ElementType;
            }
            Address= ' ' + ElementLocalName
        }
        if ($(Address).length == 1) {
            return Address + ' ' + Joint;
        } else {
            Joint = this.Climb($(Element).parent()[0], $(Element).parent()[0].localName, Address + ' ' + Joint)
            return Joint;
        }
    }
    // 获取vue的data-v-xxxx
    getDataV(element){
        var elementKeys=element.attributes;
        if(elementKeys==null){
            return null;
        }
        for(var i=0;i<elementKeys.length;i++){
            var key=elementKeys[i].name;
            if(key.indexOf("data-v-")!=-1){
                return key;
            }
        }
        return null;
    }
    // 获取placeholder="验证码"
    getPlaceholder(element){
        var elementKeys=element.attributes;
        if(elementKeys==null){
            return null;
        }
        for(var i=0;i<elementKeys.length;i++){
            var key=elementKeys[i].name.toLowerCase();
            if(key=="placeholder"&&elementKeys[i].value!=""){
                return elementKeys[i].name+"='"+elementKeys[i].value+"'";
            }
        }
        return null;
    }
    // 获取alt="kaptcha"
    getAlt(element){
        var elementKeys=element.attributes;
        if(elementKeys==null){
            return null;
        }
        for(var i=0;i<elementKeys.length;i++){
            var key=elementKeys[i].name.toLowerCase();
            if(key=="alt"){
                return elementKeys[i].name+"='"+elementKeys[i].value+"'";
            }
        }
        return null;
    }

    // 获取src="http://xxx.com"
    getSrc(element){
        var elementKeys = element.attributes;
        if(elementKeys == null){
            return null;
        }
        for(var i=0;i<elementKeys.length;i++){
            var key=elementKeys[i].name.toLowerCase();
            var value = elementKeys[i].value;
            if(key=="src" && value.indexOf("?") == -1){
                return elementKeys[i].name + "^='" + value + "'";
            }
        }
        return null;
    }

    // 判断name是否只有一个
    getElementName(element){
        var elementName=element.name;
        if(elementName==null || elementName==""){
            return null;
        }
        var selectElement=element.localName + "[name='"+elementName+"']";
        if ($(selectElement).length == 1) {
            return selectElement;
        }
        return null;
    }
    // 判断OnClick是否只有一个
    getOnClick(element){
        var elementKeys = element.attributes;
        if(elementKeys == null){
            return null;
        }
        for(var i=0;i<elementKeys.length;i++){
            var key=elementKeys[i].name.toLowerCase();
            var value = elementKeys[i].value;
            if(key=="onclick"){
                return elementKeys[i].name+"=\""+elementKeys[i].value+"\"";
            }
        }
        return null;
    }
    // 操作webStorage 增加缓存，减少对服务端的请求
    setCapFoowwLocalStorage (key, value, ttl_ms) {
        var data = { value: value, expirse: new Date(ttl_ms).getTime() };
        sessionStorage.setItem(key, JSON.stringify(data));
    }
    getCapFoowwLocalStorage (key) {
        var data = JSON.parse(sessionStorage.getItem(key));
        if (data !== null) {
            if (data.expirse != null && data.expirse < new Date().getTime()) {
                sessionStorage.removeItem(key);
            } else {
                return data.value;
            }
        }
        return null;
    }
    delCapFoowwLocalStorage(key){
        window.sessionStorage.removeItem(key);
    }
    // 添加识别错误黑名单
    addBadWeb(img,input){
        if(Set["autoBlackList"]=="false"){
            return;
        }
        this.Hint('识别过程中发生错误，已停止识别此网站！（若验证码消失，请刷新网站，需再次启用识别请联系客服）', 10000);
        this.setCapFoowwLocalStorage("err_" + img,"可能存在跨域等问题停止操作它",new Date().getTime()+(1000*1000));
        this.delCapFoowwLocalStorage("captchaHostQuery_" + window.location.host);
        this.Query({
            "method": "captchaHostAdd",
            "data": {
                "host": window.location.host,
                "path": window.location.href,
                "img": img,
                "input": input,
                "title": document.title,
                "type": 0,
                "idcard": this.IdCard()
            }
        },null);
    }
  // 设置识别识别码
  SetIdCard() {
    var that = this;
    var idCard = prompt("申请地址https://like996.icu:1205\n该功能只能设置一次，乱设置以后没得改了\n请输入您的识别码：");
    if (idCard == null || idCard == "") {
      that.Hint('取消设置');
    } else {
      GM_setValue("set", {
        "idCard": idCard
      });
      that.Hint('识别码设置完成，刷新页面生效。');
    }
    return;
  }
    // 播放音频朗读
  doWarningTone(body){
      if(body.indexOf("，")){
          body=body.split("，")[0];
      }
      if(body.indexOf(",")){
          body=body.split(",")[0];
      }
      if(body.indexOf("!")){
          body=body.split("!")[0];
      }
      var zhText = encodeURI(body);
      var text="<audio autoplay='autoplay'>"+
          "<source src='//tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=10&text="+ zhText +"' type='audio/mpeg'>"+
          "<embed height='0' width='0' src='//tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=10&text="+ zhText +"'>"+
          "</audio>";
      return text;
  }


}
//所有验证码img的对象数组
var writeResultIntervals=[];

//定时执行验证码绑定操作定时器
var writeResultInterval;

var autoIdentificationMenuId;
var showHintMenuId;
var warningToneMenuId;
var autoBlackListMenuId;
//刷新新菜单
function registerMenu(){
    // 自动规则
    GM_unregisterMenuCommand(autoIdentificationMenuId);
    if(Set["autoIdentification"]=="true"){
      autoIdentificationMenuId = GM_registerMenuCommand('自动查找验证码 [状态: √ ]', function() {
            Set["autoIdentification"]="false";
            GM_setValue("set", Set);
            registerMenu();
            crabCaptcha.Hint('已关闭自动查找验证码功能，遇到新网站请自行手动添加规则！');
        });
    }else{
       autoIdentificationMenuId = GM_registerMenuCommand('自动查找验证码 [状态: X ]', function() {
            Set["autoIdentification"]="true";
            GM_setValue("set", Set);
            registerMenu();
            crabCaptcha.Hint('已开启自动查找验证码功能，请刷新网页！');
        });
    }

    // 各类提示
    GM_unregisterMenuCommand(showHintMenuId);
    if(Set["showHintCheck"]=="true"){
      showHintMenuId = GM_registerMenuCommand('提示信息 [状态: √ ]', function() {
            crabCaptcha.Hint('提示功能已关闭，再次开启前将无任何提示！');
            Set["showHintCheck"]="false";
            GM_setValue("set", Set);
            registerMenu();
        });
    }else{
       showHintMenuId = GM_registerMenuCommand('提示信息 [状态: X ]', function() {
            Set["showHintCheck"]="true";
            GM_setValue("set", Set);
            registerMenu();
            crabCaptcha.Hint('提示功能已开启！');
        });

    }
     // 提示音
     GM_unregisterMenuCommand(warningToneMenuId);
     if(Set["showHintCheck"]=="true"){
         if(Set["warningTone"]=="true"){
             warningToneMenuId = GM_registerMenuCommand('提示音 [状态: √ ]', function() {
                 crabCaptcha.Hint('提示音功能已关闭！');
                 Set["warningTone"]="false";
                 GM_setValue("set", Set);
                 registerMenu();
             });
         }else{
             warningToneMenuId = GM_registerMenuCommand('提示音 [状态: X ]', function() {
                 Set["warningTone"]="true";
                 GM_setValue("set", Set);
                 registerMenu();
                 crabCaptcha.Hint('提示音功能已开启！');
             });
         }
     }
    // 崩溃后自动拉黑网站
     GM_unregisterMenuCommand(autoBlackListMenuId);
    if(Set["autoBlackList"]=="true"){
        warningToneMenuId = GM_registerMenuCommand('崩溃自动拉黑网站 [状态: √ ]', function() {
            crabCaptcha.Hint('崩溃自动拉黑网站功能已关闭！');
            Set["autoBlackList"]="false";
            GM_setValue("set", Set);
            registerMenu();
        });
    }else{
        warningToneMenuId = GM_registerMenuCommand('崩溃自动拉黑网站 [状态: X ]', function() {
            Set["autoBlackList"]="true";
            GM_setValue("set", Set);
            registerMenu();
            crabCaptcha.Hint('崩溃自动拉黑网站功能已开启！');
        });
    }

}

var crabCaptcha = new CaptchaWrite();
(function() {
    GM_registerMenuCommand('手动添加规则', function() {
        crabCaptcha.PickUp();
    }, 'a');

    if(Set["idCard"]=='' || Set["idCard"]==undefined){
        GM_registerMenuCommand('设置识别码', function() {
            crabCaptcha.SetIdCard();
        }, 's');
    }
    registerMenu();
    crabCaptcha.Start();
})();
