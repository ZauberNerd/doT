// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

var doT = {
    version: '1.0.1',
    defaults: {
        evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
        interpolate: /\{\{=([\s\S]+?)\}\}/g,
        encode:      /\{\{!([\s\S]+?)\}\}/g,
        use:         /\{\{#([\s\S]+?)\}\}/g,
        useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
        define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
        defineParams:/^\s*([\w$]+):([\s\S]+)/,
        conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
        varname:    'it',
        strip:      true,
        append:     true
    },
    template: undefined, //fn, compile template
    compile:  undefined  //fn, for express
};


var startend = {
    append: { start: "'+(",      end: ")+'",      endencode: "||'').toString()._doTencodeHTML()+'" },
    split:  { start: "';out+=(", end: ");out+='", endencode: "||'').toString()._doTencodeHTML();out+='"}
}, skip = /$^/;


function resolveDefs(config, block, def) {
    return ((typeof block === 'string') ? block : block.toString())
    .replace(config.define || skip, function(m, code, assign, value) {
        if (code.indexOf('def.') === 0) {
            code = code.substring(4);
        }
        if (!(code in def)) {
            if (assign === ':') {
                if (config.defineParams) value.replace(config.defineParams, function(m, param, v) {
                    def[code] = {arg: param, text: v};
                });
                if (!(code in def)) def[code]= value;
            } else {
                new Function("def", "def['"+code+"']=" + value)(def);
            }
        }
        return '';
    })
    .replace(config.use || skip, function(m, code) {
        if (config.useParams) code = code.replace(config.useParams, function(m, s, d, param) {
            if (def[d] && def[d].arg && param) {
                var rw = (d+":"+param).replace(/'|\\/g, '_');
                def.__exp = def.__exp || {};
                def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
                return s + "def.__exp['"+rw+"']";
            }
        });
        var v = new Function("def", "return " + code)(def);
        return v ? resolveDefs(config, v, def) : v;
    });
}


function safeObject(code) {
    var parts  = code.split('.'),
        len    = parts.length,
        result = '(' + parts[0],
        obj    = parts[0],
        i      = 1;

    if (len <= 1) { return code; }

    for (; i < len; i += 1) {
        obj += '.' + parts[i];
        result += ' && ' + obj;
    }

    return result + ' || \'\'' + ')';
}


function unescape(code) {
    return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
}


doT.template = function(tmpl, config, def) {
    config = config || {};
    for (var key in doT.defaults) {
        if (config[key] === undefined) {
            config[key] = dot.defaults[key];
        }
    }
    var cse = config.append ? startend.append : startend.split,
        sid = 0,
        indv,
        str  = (config.use || config.define) ? resolveDefs(config, tmpl, def || {}) : tmpl;

    str = ("var out='" + (config.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
                .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str)
        .replace(/'|\\/g, '\\$&')
        .replace(config.interpolate || skip, function(m, code) {
            return cse.start + safeObject(unescape(code)) + cse.end;
        })
        .replace(config.encode || skip, function(m, code) {
            return cse.start + safeObject(unescape(code)) + cse.endencode;
        })
        .replace(config.conditional || skip, function(m, elsecase, code) {
            return elsecase ?
                (code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
                (code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
        })
        .replace(config.iterate || skip, function(m, iterate, vname, iname) {
            if (!iterate) return "';} } out+='";
            sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
            return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
                +vname+"=arr"+sid+"["+indv+"+=1];out+='";
        })
        .replace(config.evaluate || skip, function(m, code) {
            return "';" + unescape(code) + "out+='";
        })
        + "';return out;")
        .replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
        .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, '')
        .replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

    try {
        return new Function(config.varname, str);
    } catch (e) {
        if (typeof console !== 'undefined') console.log("Could not create a template function: " + str);
        throw e;
    }
};


doT.compile = function(tmpl, def) {
    return doT.template(tmpl, null, def);
};


module.exports = doT;
