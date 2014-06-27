var assert = require("assert"), doT = require("../doT");

describe('doT', function(){
	var basictemplate = "<div>{{!it.foo}}</div>",
		basiccompiled = doT.template(basictemplate),
		definestemplate = "{{##def.tmp:<div>{{!it.foo}}</div>#}}{{#def.tmp}}",
		definescompiled = doT.template(definestemplate);

	describe('#template()', function(){
		it('should return a function', function(){
		   assert.equal("function", typeof basiccompiled);
		});
	});

	describe('#()', function(){
		it('should render the template', function(){
		   assert.equal("<div>http</div>", basiccompiled({foo:"http"}));
		   assert.equal("<div>http:&#47;&#47;abc.com</div>", basiccompiled({foo:"http://abc.com"}));
		   assert.equal("<div></div>", basiccompiled({}));
		});
	});

	describe('defines', function(){
		it('should render define', function(){
		   assert.equal("<div>http</div>", definescompiled({foo:"http"}));
		   assert.equal("<div>http:&#47;&#47;abc.com</div>", definescompiled({foo:"http://abc.com"}));
		   assert.equal("<div></div>", definescompiled({}));
		});
	});
});

describe("iterate object (for..in)", function() {
    function Obj() {
        this.awesome = "doT.js";
    }
    Obj.prototype = {
        one: 1,
        2: "two",
        THREE: 3
    };

    var obj;

    beforeEach(function() {
        obj = new Obj();
    });

    it("should iterate all object properties", function() {
        var tpl = doT.compile('{{@ it :val :key}}[{{=key}}={{=val}}]{{@}}');
        var exp = '';
        for (var k in obj) {
            exp += "[" + k + "=" + obj[k] + "]";
        }
        assert.equal(tpl(obj), exp);
    });

    it("should iterate only own properties", function() {
        var tpl = doT.compile('{{@@ it :val :key}}[{{=key}}={{=val}}]{{@@}}');
        var exp = '';
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                exp += "[" + k + "=" + obj[k] + "]";
            }
        }
        assert.equal(tpl(obj), exp);
    });
});