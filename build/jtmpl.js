(function() {
  var RE_ANYTHING, RE_COLLECTION_TEMPLATE, RE_DATA_JT, RE_IDENTIFIER, RE_NODE_ID, RE_PIPE, RE_SPACE, RE_URL, addClass, alertDependents, compileTemplate, createSectionItem, decompileTemplate, escapeHTML, escapeRE, getValue, hasClass, injectAttributes, injectTagBinding, isDefined, isValidHTMLTag, jtmpl, lastOpenedHTMLTag, multiReplace, propChange, regexp, removeClass,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  jtmpl = (typeof exports !== "undefined" && exports !== null ? exports : this).jtmpl = function(target, template, model, options) {
    var args, html, newTarget, opts, rule, _i, _len, _ref, _ref1, _ref2;
    args = [].slice.call(arguments);
    if (args.length === 1 && typeof args[0] === 'string') {
      return [].slice.call(document.querySelectorAll(args[0]));
    } else if ((_ref = args[0]) === 'GET' || _ref === 'POST') {
      return jtmpl.xhr(args);
    } else if (typeof args[0] === 'string' && (typeof args[1] !== 'string' || args.length === 2) && ((_ref1 = args.length) === 2 || _ref1 === 3)) {
      template = '' + (args[0].match(RE_NODE_ID) && document.querySelector(args[0]).innerHTML || args[0]);
      opts = jtmpl.options(args[2], args[1]);
      _ref2 = jtmpl.preprocessingRules;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        rule = _ref2[_i];
        template = template.replace(regexp(rule[0], opts.delimiters), rule[1]);
      }
      return jtmpl.compile(template, args[1], null, false, opts).trim();
    } else if (typeof args[0].cloneNode === 'function' && typeof args[1] === 'object') {
      jtmpl.bind(args[0], args[1], jtmpl.options(args[2], args[1]));
      return jtmpl.postbind(args[1]);
    } else {
      target = typeof args[0].cloneNode === 'function' && args[0] || document.querySelector(args[0]);
      template = args[1].match(RE_NODE_ID) && document.querySelector(args[1]).innerHTML || args[1];
      model = args[2];
      opts = jtmpl.options(args[3], args[2]);
      if (target.nodeName === 'SCRIPT') {
        newTarget = document.createElement(opts.defaultTargetTag);
        newTarget.id = target.id;
        target.parentNode.replaceChild(newTarget, target);
        target = newTarget;
      }
      html = jtmpl(template, model, opts);
      if (target.innerHTML !== html) {
        target.innerHTML = html;
      }
      return jtmpl(target, model, opts);
    }
  };

  jtmpl.defaultOptions = {
    delimiters: '{{ }}',
    compiledDelimiters: '#{ }#',
    defaultSection: 'div',
    defaultSectionItem: 'div',
    defaultVar: 'span',
    defaultPartial: 'div',
    defaultTargetTag: 'div'
  };

  jtmpl.options = function(options, rootModel) {
    var opts, prop;
    options = options || {};
    opts = JSON.parse(JSON.stringify(jtmpl.defaultOptions));
    for (prop in Object.getOwnPropertyNames(options)) {
      opts[prop] = options[prop];
    }
    opts.delimiters = opts.delimiters.split(' ');
    opts.compiledDelimiters = opts.compiledDelimiters.split(' ');
    opts.rootModel = options.rootModel ? options.rootModel : rootModel;
    return opts;
  };

  jtmpl.xhr = function(args) {
    var callback, opts, prop, request, xhr, _i, _len, _ref;
    xhr = new XMLHttpRequest();
    callback = args.reduce(function(prev, curr) {
      if (typeof curr === 'function') {
        return curr;
      } else {
        return prev;
      }
    }, null);
    opts = args[args.length - 1];
    if (typeof opts !== 'object') {
      opts = {};
    }
    _ref = Object.getOwnPropertyNames(opts);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      prop = _ref[_i];
      xhr[prop] = opts[prop];
    }
    request = typeof args[2] === 'string' ? args[2] : typeof args[2] === 'object' ? Object.keys(args[2]).map(function(x) {
      return "" + x + "=" + (encodeURIComponent(args[2][x]));
    }).join('&') : '';
    xhr.onload = function(event) {
      var resp;
      if (callback) {
        try {
          resp = JSON.parse(this.responseText);
        } catch (_error) {
          resp = this.responseText;
        }
        return callback.call(this, resp, event);
      }
    };
    xhr.open(args[0], args[1], opts.async || true, opts.user, opts.password);
    return xhr.send(request);
  };

  RE_IDENTIFIER = '[\\w\\.\\-]+';

  RE_NODE_ID = '^#[\\w\\.\\-]+$';

  RE_ANYTHING = '[\\s\\S]*?';

  RE_SPACE = '\\s*';

  RE_PIPE = "(?: \\| (" + RE_IDENTIFIER + ") )?";

  RE_DATA_JT = '(?: ( \\s* data-jt = " [^"]* )" )?';

  RE_COLLECTION_TEMPLATE = /^(#|\^)\s([\s\S]*)$/;

  RE_URL = '\w?\\:?\\/\\/[^\\s"\']+';

  jtmpl.preprocessingRules = [["({{) { (" + RE_IDENTIFIER + ") } (}})", '$1&$2$3'], ["<!-- " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " -->", '$1'], ["(" + RE_IDENTIFIER + ")='({{ " + RE_IDENTIFIER + " }})'", '$1=$2'], ["(" + RE_IDENTIFIER + ")=\"({{ " + RE_IDENTIFIER + " }})\"", '$1=$2'], ["\\n " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " \\n", '\n$1\n'], ['{{&gt;', '{{>']];

  jtmpl.formatters = {};

  jtmpl.mappings = {};

  jtmpl.partials = {};

  jtmpl.compileRules = [
    {
      pattern: "(class=\"? [\\w \\. \\- \\s {{}}]*) {{ (" + RE_IDENTIFIER + ") }}$",
      replaceWith: function(pre, prop, model) {
        var val;
        val = getValue(model, prop);
        return [(pre.search('{') === -1 && pre || ' ') + (typeof val === 'boolean' && val && prop || ''), []];
      },
      echoReplaceWith: function(pre, prop) {
        if (pre.search('{') > -1) {
          return " {{" + prop + "}}";
        } else {
          return null;
        }
      },
      bindingToken: function(pre, prop) {
        return "class=" + prop;
      }
    }, {
      pattern: "on(" + RE_IDENTIFIER + ") = {{ (" + RE_IDENTIFIER + ") }}$",
      replaceWith: function() {
        return ['', []];
      },
      bindingToken: function(event, handler) {
        return "on" + event + "=" + handler;
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = {{ (" + RE_IDENTIFIER + ") }}$",
      replaceWith: function(attr, prop, model) {
        var val;
        val = getValue(model, prop);
        if ((val == null) || val === null) {
          return ['', []];
        } else if (typeof val === 'boolean') {
          return [(val ? attr : ''), []];
        } else {
          return ["" + attr + "=\"" + val + "\"", []];
        }
      },
      bindingToken: function(attr, prop) {
        return "" + attr + "=" + prop;
      }
    }, {
      pattern: "{{ \\^ (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultSection',
      lastTag: function(model, section) {
        if (Array.isArray(model != null ? model[section] : void 0)) {
          return section;
        } else {
          return null;
        }
      },
      contents: function(template, model, section, options) {
        var val;
        val = getValue(model, section);
        return [Array.isArray(val) ? !val.length ? jtmpl(template, model) : '' : !val ? jtmpl(template, model) : '', [['data-jt-0', compileTemplate(template, options)]]];
      },
      bindingToken: function(section) {
        return "^" + section;
      }
    }, {
      pattern: "{{ \\# (" + RE_IDENTIFIER + ") " + RE_PIPE + " }}$",
      lastTag: function(model, section, mapping) {
        if (Array.isArray(model != null ? model[section] : void 0)) {
          return section;
        } else {
          return null;
        }
      },
      wrapper: 'defaultSection',
      contents: function(template, model, section, mapping, options) {
        var item, val;
        mapping = model && mapping ? options.rootModel[mapping] || (model != null ? model[mapping] : void 0) || jtmpl.mappings[mapping] : null;
        val = getValue(model, section, false, null, null, mapping);
        return [
          Array.isArray(val) ? ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = val.length; _i < _len; _i++) {
              item = val[_i];
              _results.push(jtmpl(template, item, {
                asArrayItem: true,
                rootModel: options.rootModel
              }));
            }
            return _results;
          })()).join('') : typeof val === 'object' ? jtmpl(template, val, options) : val ? jtmpl(template, model, options) : '', [['data-jt-1', compileTemplate(template, options)]]
        ];
      },
      bindingToken: function(section) {
        return "#" + section;
      }
    }, {
      pattern: "{{ > \"( (?: \\# " + RE_IDENTIFIER + ") )\" }}",
      wrapper: 'defaultPartial',
      replaceWith: function(partial, model) {
        var _ref;
        if (model) {
          return [(document ? jtmpl(((_ref = document.querySelector(partial)) != null ? _ref.innerHTML : void 0) || jtmpl.partials[partial.slice(1)] || '', model) : jtmpl(jtmpl.partials[partial.slice(1)] || '', model)), []];
        } else {
          return ['', []];
        }
      },
      bindingToken: function(partial) {
        return ">\"" + partial + "\"";
      }
    }, {
      pattern: "{{ & (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultVar',
      replaceWith: function(prop, model) {
        return [getValue(model, prop), []];
      },
      bindingToken: function(prop) {
        return prop;
      }
    }, {
      pattern: "{{ (" + RE_IDENTIFIER + ") " + RE_PIPE + " }}$",
      wrapper: 'defaultVar',
      replaceWith: function(prop, formatter, model) {
        var _ref;
        return [escapeHTML(getValue(model, prop, void 0, void 0, (model != null ? model[formatter] : void 0) || ((_ref = jtmpl.formatters) != null ? _ref[formatter] : void 0) || null)), []];
      },
      bindingToken: function(prop, formatter) {
        return prop + (formatter ? '|' + formatter : '');
      }
    }
  ];

  jtmpl.bindRules = [
    {
      pattern: "(value | checked | selected) = (" + RE_IDENTIFIER + ")",
      bindTo: function(attr, prop) {
        return prop;
      },
      react: function(node, attr, prop, model) {
        var reaction, reactor, _ref;
        if (node.nodeName === 'OPTION') {
          node.parentNode.addEventListener('change', function() {
            if (model[prop] !== node.selected) {
              return model[prop] = node.selected;
            }
          });
        }
        if (node.type === 'radio' && node.name) {
          node.addEventListener('change', function() {
            var input, _i, _len, _ref;
            if (node[attr]) {
              _ref = document.querySelectorAll("input[type=radio][name=" + node.name + "]");
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                input = _ref[_i];
                if (input !== node) {
                  input.dispatchEvent(new Event('change'));
                }
              }
            }
            return model[prop] = node[attr];
          });
        }
        if ((_ref = node.type) === 'text' || _ref === 'password') {
          node.addEventListener('input', function() {
            return model[prop] = node[attr];
          });
        } else {
          node.addEventListener('change', function() {
            return model[prop] = node[attr];
          });
        }
        reaction = function(val) {
          val = getValue(model, prop, true, reactor);
          if (val === void 0) {
            return;
          }
          if (node[attr] !== val) {
            return node[attr] = val;
          }
        };
        reactor = function(val) {
          if (val !== void 0) {
            return reaction(val);
          }
        };
        if (typeof model[prop] === 'function') {
          reactor(getValue(model, prop, true, reaction));
        }
        return reactor;
      }
    }, {
      pattern: "on(" + RE_IDENTIFIER + ") = (" + RE_IDENTIFIER + ")",
      react: function(node, evnt, listener, model, options) {
        var handler, key, pair, _base, _i, _len, _ref, _ref1;
        handler = (options != null ? (_ref = options.rootModel) != null ? _ref[listener] : void 0 : void 0) || model[listener];
        if (typeof handler === 'function') {
          key = evnt + listener;
          _ref1 = model.__jt__.domListeners[key] || [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            pair = _ref1[_i];
            if (pair[0] === node) {
              return;
            }
          }
          node.addEventListener(evnt, handler.bind(model));
          if ((_base = model.__jt__.domListeners)[key] == null) {
            _base[key] = [];
          }
          model.__jt__.domListeners[key].push([node, evnt, handler]);
        } else {
          throw ":( " + listener + " is not a function, cannot attach event handler";
        }
        return null;
      }
    }, {
      pattern: "class = (" + RE_IDENTIFIER + ")",
      bindTo: function(prop) {
        return prop;
      },
      react: function(node, prop, model) {
        var reaction, reactor;
        reaction = function(val) {
          return (val && addClass || removeClass)(node, prop);
        };
        reactor = function(val) {
          if (val !== void 0) {
            return reaction(val);
          }
        };
        if (typeof model[prop] === 'function') {
          reactor(getValue(model, prop, true, reaction));
        }
        return reactor;
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = (" + RE_IDENTIFIER + ")",
      bindTo: function(attr, prop) {
        return prop;
      },
      react: function(node, attr, prop, model) {
        var reaction, reactor;
        reaction = function(val) {
          if (node[attr] !== val) {
            return node[attr] = val;
          }
        };
        reactor = function(val) {
          if (val !== void 0) {
            return reaction(val);
          }
        };
        if (typeof model[prop] === 'function') {
          reactor(getValue(model, prop, true, reaction));
        }
        return reactor;
      }
    }, {
      pattern: "^(# | \\^) (" + RE_IDENTIFIER + ") " + RE_PIPE + " $",
      bindTo: function(sectionType, prop) {
        return prop;
      },
      recurseContext: function(sectionType, attr, mapping, model) {
        var val;
        val = model[attr];
        if (Array.isArray(val)) {
          return null;
        } else if (typeof val === 'object') {
          return val;
        } else {
          return model;
        }
      },
      react: function(node, sectionType, prop, mapping, model, options) {
        var child, i, opts, reaction, reactor, val, _i, _len, _ref;
        this.index = (this.index || 0) + 1;
        mapping = options.rootModel[mapping] || model[mapping] || jtmpl.mappings[mapping];
        val = getValue(model, prop, false, null, null, mapping);
        opts = jtmpl.options(options);
        if (Array.isArray(val) && sectionType === '#') {
          jtmpl.bindArrayToNodeChildren(model, prop, node, options);
          _ref = node.children;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            child = _ref[i];
            if (typeof val[i] === 'object') {
              jtmpl.bind(child, val[i], opts);
            }
          }
        }
        reaction = function(val) {
          var item, _j, _len1, _results;
          if (Array.isArray(val)) {
            jtmpl.bindArrayToNodeChildren(model, prop, node, opts);
            node.innerHTML = !val.length ? jtmpl(decompileTemplate(node.getAttribute('data-jt-0') || '', opts), model) : '';
            _results = [];
            for (_j = 0, _len1 = val.length; _j < _len1; _j++) {
              item = val[_j];
              _results.push(node.appendChild(jtmpl.createSectionItem(node, item, opts)));
            }
            return _results;
          } else {
            if (typeof val === 'object') {
              if (Object.getOwnPropertyNames(val).length) {
                node.innerHTML = jtmpl(decompileTemplate(node.getAttribute('data-jt-1') || '', opts), val, opts);
                jtmpl.unbind(model[prop]);
                return jtmpl.bind(node, model, opts);
              }
            } else {
              return node.innerHTML = jtmpl(decompileTemplate(sectionType === '#' && val ? node.getAttribute('data-jt-1') || '' : sectionType === '^' && !val ? node.getAttribute('data-jt-0') || '' : '', opts), model, opts);
            }
          }
        };
        reactor = function(val) {
          if (val !== void 0) {
            return reaction(val);
          }
        };
        if (typeof model[prop] === 'function') {
          reactor(getValue(model, prop, true, reaction, mapping));
        }
        return reactor;
      }
    }, {
      pattern: '>"(.*?)"',
      bindTo: function(partial) {
        return null;
      },
      react: function(node, partial, model, options) {
        if (!node.innerHTML) {
          if (partial.match(RE_NODE_ID)) {
            node.innerHTML = jtmpl(partial, model, options);
          }
          if (partial.match(RE_URL)) {
            jtmpl('GET', partial, (function(resp) {
              return node.innerHTML = resp;
            }));
          }
        }
        return function(val) {
          console.log('partial react');
          return console.log(val);
        };
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") " + RE_PIPE,
      bindTo: function(prop) {
        return prop;
      },
      react: function(node, prop, formatter, model, options) {
        var reaction, reactor;
        reaction = function(val) {
          var _ref, _ref1;
          node.innerHTML = (((_ref = options.rootModel) != null ? _ref[formatter] : void 0) || model[formatter] || ((_ref1 = jtmpl.formatters) != null ? _ref1[formatter] : void 0) || (function(x) {
            return x;
          }))(val);
          if (typeof val === 'object') {
            return jtmpl.bind(node, model, options);
          }
        };
        reactor = function(val) {
          if (val !== void 0) {
            return reaction(val);
          }
        };
        if (typeof model[prop] === 'function') {
          reactor(getValue(model, prop, true, reaction, formatter));
        }
        return reactor;
      }
    }
  ];

  jtmpl.compile = function(template, model, openTag, echoMode, options, asArrayItem) {
    var args, bindingToken, closing, contents, htagPos, lastSectionHTagPos, lastSectionTag, match, pos, replaceWith, result, rule, section, slice, tag, tmpl, token, tokenizer, wrapperAttrs, _i, _len, _ref, _ref1, _ref2;
    tokenizer = regexp("{{ (\/?) (" + RE_ANYTHING + ") }}", options.delimiters);
    result = '';
    pos = 0;
    while ((token = tokenizer.exec(template))) {
      if (token[1]) {
        if (token[2] !== openTag) {
          throw new Error(openTag && (":( expected {{/" + openTag + "}}, got {{" + token[2] + "}}") || (":( unexpected {{/" + token[2] + "}}"));
        }
        return result + template.slice(pos, tokenizer.lastIndex - token[0].length);
      }
      slice = template.slice(Math.max(0, pos - 128), tokenizer.lastIndex);
      _ref = jtmpl.compileRules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        match = regexp(rule.pattern, options.delimiters).exec(slice);
        if (match) {
          result += template.slice(pos, tokenizer.lastIndex - match[0].length);
          htagPos = lastOpenedHTMLTag(result);
          bindingToken = rule.bindingToken.apply(rule, match.slice(1));
          if (rule.replaceWith != null) {
            if (echoMode) {
              result += (typeof rule.echoReplaceWith === "function" ? rule.echoReplaceWith.apply(rule, match.slice(1)) : void 0) || match[0];
            } else {
              _ref1 = rule.replaceWith.apply(rule, match.slice(1).concat([model])), replaceWith = _ref1[0], wrapperAttrs = _ref1[1];
              if (htagPos === -1 && (rule.wrapper != null)) {
                tag = options[rule.wrapper];
                result += injectAttributes(injectTagBinding("<" + tag + ">" + replaceWith + "</" + tag + ">", bindingToken), wrapperAttrs);
              } else {
                result += replaceWith;
                result = result.slice(0, htagPos) + injectAttributes(injectTagBinding(result.slice(htagPos), bindingToken), wrapperAttrs);
              }
            }
            pos = tokenizer.lastIndex;
          } else {
            tmpl = jtmpl.compile(template.slice(tokenizer.lastIndex), model, match[1], true, options);
            tokenizer.lastIndex += tmpl.length;
            closing = tokenizer.exec(template);
            pos = tokenizer.lastIndex;
            if (echoMode) {
              result += token[0] + tmpl + closing[0];
            } else {
              section = match[1];
              args = [tmpl, model].concat(match.slice(1)).concat([options]);
              _ref2 = rule.contents.apply(rule, args), contents = _ref2[0], wrapperAttrs = _ref2[1];
              if (htagPos === -1) {
                tag = options[rule.wrapper];
                if (section !== lastSectionTag) {
                  lastSectionHTagPos = result.length;
                  result += injectAttributes(injectTagBinding("<" + tag + ">" + contents + "</" + tag + ">", bindingToken), wrapperAttrs);
                } else {
                  result = result.slice(0, lastSectionHTagPos) + injectAttributes(injectTagBinding(result.slice(lastSectionHTagPos), bindingToken), wrapperAttrs, contents.trim());
                }
              } else {
                result = result.slice(0, htagPos) + injectAttributes(injectTagBinding(result.slice(htagPos), bindingToken), wrapperAttrs) + contents.trim();
                lastSectionHTagPos = htagPos;
              }
              lastSectionTag = (typeof rule.lastTag === "function" ? rule.lastTag(model, section) : void 0) || null;
            }
          }
          break;
        }
      }
    }
    result += template.slice(pos);
    if (options.asArrayItem) {
      if (isValidHTMLTag(result)) {
        return result;
      } else {
        tag = options.defaultSectionItem;
        return "<" + tag + ">" + result + "</" + tag + ">";
      }
    } else {
      return result;
    }
  };

  injectTagBinding = function(template, token) {
    var attrLen, match, pos;
    match = regexp("^ (" + RE_SPACE + " < " + RE_IDENTIFIER + ") (" + RE_ANYTHING + ") " + RE_DATA_JT).exec(template);
    attrLen = (match[3] || '').length;
    pos = match[1].length + match[2].length + attrLen;
    token = escapeHTML(token);
    return template.slice(0, pos) + (attrLen ? (match[3].trim() === 'data-jt="' ? '' : ' ') + token : ' data-jt="' + token + '"') + template.slice(pos);
  };

  injectAttributes = function(template, attributes, contents) {
    var match, pair, pos;
    if (!attributes.length) {
      return template;
    }
    match = regexp("^ (" + RE_SPACE + " < " + RE_IDENTIFIER + " " + RE_ANYTHING + ")>").exec(template);
    pos = match[1].length;
    return template.slice(0, pos) + [
      (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = attributes.length; _i < _len; _i++) {
          pair = attributes[_i];
          _results.push(" " + pair[0] + "=\"" + (escapeHTML(pair[1])) + "\"");
        }
        return _results;
      })()
    ].join('') + '>' + (contents || '') + template.slice(pos + 1);
  };

  lastOpenedHTMLTag = function(template) {
    return template.trimRight().search(regexp("< " + RE_IDENTIFIER + " [^>]*? >?$"));
  };

  isValidHTMLTag = function(contents) {
    return !!contents.trim().match(regexp("^<(" + RE_IDENTIFIER + ") " + RE_SPACE + "        [^>]*? > " + RE_ANYTHING + " </\\1>$ | < [^>]*? />$"));
  };

  jtmpl.postbind = function(model) {
    var hashchange, props, routes;
    if (typeof model['#'] === 'function') {
      model['#'].apply(model);
    }
    props = Object.getOwnPropertyNames(model);
    routes = props.filter(function(prop) {
      return regexp("#" + RE_ANYTHING).exec(prop);
    });
    if (routes.length && window) {
      hashchange = function() {
        var match, route, _i, _len;
        for (_i = 0, _len = routes.length; _i < _len; _i++) {
          route = routes[_i];
          if (__indexOf.call(route, '(') >= 0) {
            match = new RegExp(route, 'g').exec(window.location.hash);
            if (match && typeof model[route] === 'function') {
              model[route].apply(model, match.slice(1));
            }
          } else {
            if (route === window.location.hash && typeof model[route] === 'function') {
              model[route].apply(model);
            }
          }
        }
      };
      hashchange();
      if (!model.__jt__.domListeners['hashchange']) {
        window.addEventListener('hashchange', hashchange);
        return model.__jt__.domListeners['hashchange'] = true;
      }
    }
  };

  jtmpl.bind = function(node, model, options, nodeCounter) {
    var child, data_jt, jt, key, match, prop, reactor, recurseContext, rule, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
    if (typeof model === 'object' && !model.__jt__) {
      model.__jt__ = {
        dependents: {},
        listeners: {},
        domListeners: {},
        bound: {}
      };
    }
    nodeCounter = (nodeCounter || 0) + 1;
    if (data_jt = node.getAttribute('data-jt')) {
      _ref = data_jt.trim().split(' ');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        jt = _ref[_i];
        _ref1 = jtmpl.bindRules;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          rule = _ref1[_j];
          if (match = regexp(rule.pattern).exec(jt)) {
            reactor = rule.react.apply(rule, [node].concat(match.slice(1), [model, options]));
            prop = typeof rule.bindTo === "function" ? rule.bindTo.apply(rule, match.slice(1)) : void 0;
            key = prop + rule.pattern + jt + nodeCounter;
            if (!(model != null ? model.__jt__.bound[key] : void 0)) {
              propChange(model, prop, reactor);
            }
            if (typeof model === 'object') {
              model.__jt__.bound[key] = true;
            }
            recurseContext = typeof rule.recurseContext === "function" ? rule.recurseContext.apply(rule, match.slice(1).concat([model])) : void 0;
            break;
          }
        }
      }
    }
    if (recurseContext !== null) {
      _ref2 = node.children;
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        child = _ref2[_k];
        nodeCounter += 1;
        _results.push(jtmpl.bind(child, recurseContext || model, options, nodeCounter));
      }
      return _results;
    }
  };

  jtmpl.unbind = function(model) {
    var key, listener, listeners, _i, _len, _ref, _ref1;
    if (typeof (model != null ? (_ref = model.__jt__) != null ? _ref.domListeners : void 0 : void 0) === 'object') {
      _ref1 = model.__jt__.domListeners;
      for (key in _ref1) {
        listeners = _ref1[key];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          listener[0].removeEventListener(listener[1], listener[2]);
        }
      }
      return model.__jt__.domListeners = {};
    }
  };

  escapeRE = function(s) {
    return (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  };

  regexp = function(src, delimiters) {
    src = src.replace(/\s+/g, '');
    return new RegExp((delimiters ? src.replace('{{', escapeRE(delimiters[0])).replace('}}', escapeRE(delimiters[1])) : src), 'g');
  };

  getValue = function(model, prop, trackDependencies, callback, formatter, mapping) {
    var dependencyTracker, getter, result, val;
    if (model === null || model === void 0 || prop === null || prop === void 0) {
      return null;
    }
    formatter = formatter || function(x) {
      return x;
    };
    getter = function(prop) {
      var result;
      result = model[prop];
      return formatter(typeof result === 'function' ? result.call(getter) : result);
    };
    dependencyTracker = function(propToReturn) {
      var _base;
      if ((_base = model.__jt__.dependents)[propToReturn] == null) {
        _base[propToReturn] = [];
      }
      if (model.__jt__.dependents[propToReturn].indexOf(prop) === -1) {
        model.__jt__.dependents[propToReturn].push(prop);
      }
      return getter(propToReturn);
    };
    if (prop === '.') {
      return formatter(model);
    }
    val = model[prop];
    result = typeof val === 'function' ? val.call(trackDependencies ? dependencyTracker : getter, callback) : formatter(val);
    if (typeof mapping === 'function' && Array.isArray(result)) {
      return result.map(mapping).filter(isDefined);
    } else {
      return result;
    }
  };

  isDefined = function(x) {
    return x !== null && x !== void 0;
  };

  escapeHTML = function(val) {
    return ((val != null) && val || '').toString().replace(/[&"<>\\]/g, function(s) {
      return {
        '&': '&amp;',
        '\\': '\\\\',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
      }[s];
    });
  };

  multiReplace = function(template, from, to) {
    var find, i, _i, _len;
    for (i = _i = 0, _len = from.length; _i < _len; i = ++_i) {
      find = from[i];
      template = template.replace(regexp(escapeRE(find)), to[i]);
    }
    return template;
  };

  compileTemplate = function(template, options) {
    return multiReplace(template.trim(), options.delimiters, options.compiledDelimiters);
  };

  decompileTemplate = function(template, options) {
    return multiReplace(template.trim(), options.compiledDelimiters, options.delimiters);
  };

  jtmpl.createSectionItem = createSectionItem = function(parent, context, options) {
    var element;
    if (context === void 0) {
      context = {};
    }
    element = document.createElement('body');
    element.innerHTML = jtmpl(multiReplace(parent.getAttribute('data-jt-1') || '', options.compiledDelimiters, options.delimiters), context);
    element = element.children[0];
    if (typeof context === 'object') {
      jtmpl(element, element.innerHTML, context, options);
    }
    return element;
  };

  jtmpl.hasClass = hasClass = function(el, name) {
    return new RegExp("(\\s|^)" + name + "(\\s|$)").test(el.className);
  };

  jtmpl.addClass = addClass = function(el, name) {
    if (!hasClass(el, name)) {
      return el.className += (el.className && ' ' || '') + name;
    }
  };

  jtmpl.removeClass = removeClass = function(el, name) {
    if (hasClass(el, name)) {
      return el.className = el.className.replace(new RegExp("(\\s|^)" + name + "(\\s|$)"), '').replace(/^\s+|\s+$/g, '');
    }
  };

  propChange = function(obj, prop, callback) {
    var catchSignal, value;
    if (!(obj && prop && callback)) {
      return;
    }
    if (obj[prop] === void 0) {
      obj[prop] = null;
    }
    if (Array.isArray(obj.__jt__.listeners[prop])) {
      obj.__jt__.listeners[prop].push(callback);
      return;
    }
    obj.__jt__.listeners[prop] = [callback];
    catchSignal = function(val) {
      var signal;
      if (signal = val != null ? val.__signal__ : void 0) {
        val = getValue(signal.obj, signal.prop, true, callback);
        if (val !== void 0) {
          callback(val);
        }
        return true;
      } else {
        return false;
      }
    };
    value = obj[prop];
    return Object.defineProperty(obj, prop, {
      get: function() {
        return value;
      },
      set: function(val) {
        var cb, _i, _len, _ref;
        if (!catchSignal(val)) {
          if (typeof value === 'function') {
            value.call((function(p, val) {
              return obj[p] = val;
            }), val);
          } else {
            value = val;
          }
          _ref = obj.__jt__.listeners[prop];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cb = _ref[_i];
            cb(val);
          }
        }
        return alertDependents(obj, prop);
      },
      configurable: true,
      enumerable: false
    });
  };

  alertDependents = function(obj, prop) {
    var dependent, _i, _len, _ref;
    _ref = obj.__jt__.dependents[prop] || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependent = _ref[_i];
      if (typeof dependent === 'function') {
        dependent();
      } else {
        obj[dependent] = {
          __signal__: {
            obj: obj,
            prop: dependent
          }
        };
      }
    }
  };

  jtmpl.bindArrayToNodeChildren = function(model, prop, node, options) {
    var array, bindProp, i, item, mutable, operation, proxy, _i, _len, _ref;
    array = model[prop];
    if (!array.__values) {
      mutable = function(method) {
        return function() {
          var i, result, _i, _j, _len, _len1, _ref, _ref1;
          if (!this.length) {
            _ref = this.__nodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              node = _ref[_i];
              node.innerHTML = '';
            }
          }
          i = this.__nodes.length;
          while (--i) {
            if (!this.__nodes[i].parentNode) {
              this.__nodes.splice(i, 1);
            }
          }
          result = method.apply(this, arguments);
          if (!this.length) {
            _ref1 = this.__nodes;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              node = _ref1[_j];
              node.innerHTML = jtmpl(multiReplace(node.getAttribute('data-jt-0') || '', options.compiledDelimiters, options.delimiters), {});
            }
          }
          alertDependents(model, prop);
          return result;
        };
      };
      _ref = {
        pop: function() {
          var _i, _len, _ref;
          if (this.length) {
            _ref = this.__nodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              node = _ref[_i];
              node.removeChild(node.children[node.children.length - 1]);
            }
          }
          return [].pop.apply(this, arguments);
        },
        push: function(item) {
          var result, _i, _len, _ref;
          _ref = this.__nodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.appendChild(createSectionItem(node, item, options));
          }
          result = [].push.apply(this, arguments);
          bindProp(item, this.length - 1);
          return result;
        },
        reverse: function() {
          var i, item, _i, _j, _len, _ref;
          _ref = this.__nodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.innerHTML = '';
            for (i = _j = this.length - 1; _j >= 0; i = _j += -1) {
              item = this[i];
              node.appendChild(createSectionItem(node, item, options));
              bindProp(item, i);
            }
          }
          return [].reverse.apply(this, arguments);
        },
        shift: function() {
          var i, item, result, _i, _j, _len, _len1, _ref;
          _ref = this.__nodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.removeChild(node.children[0]);
          }
          result = [].shift.apply(this, arguments);
          for (i = _j = 0, _len1 = this.length; _j < _len1; i = ++_j) {
            item = this[i];
            bindProp(item, i);
          }
          return result;
        },
        unshift: function() {
          var i, item, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
          _ref = [].slice.call(arguments).reverse();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            _ref1 = this.__nodes;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              node = _ref1[_j];
              node.insertBefore(createSectionItem(node, item, options), node.children[0]);
            }
          }
          result = [].unshift.apply(this, arguments);
          for (i = _k = 0, _len2 = this.length; _k < _len2; i = ++_k) {
            item = this[i];
            bindProp(item, i);
          }
          return result;
        },
        sort: function() {
          var i, item, _i, _j, _len, _len1, _ref;
          [].sort.apply(this, arguments);
          _ref = this.__nodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.innerHTML = '';
            for (i = _j = 0, _len1 = this.length; _j < _len1; i = ++_j) {
              item = this[i];
              node.appendChild(createSectionItem(node, item, options));
              bindProp(item, i);
            }
          }
          return this;
        },
        splice: function(index, howMany) {
          var i, item, _i, _j, _k, _len, _len1, _ref, _ref1;
          _ref = this.__nodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            for (i = _j = 0; 0 <= howMany ? _j < howMany : _j > howMany; i = 0 <= howMany ? ++_j : --_j) {
              node.removeChild(node.children[index]);
            }
            _ref1 = [].slice.call(arguments, 2);
            for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
              item = _ref1[_k];
              node.insertBefore(createSectionItem(node, item, options), node.children[index]);
              bindProp(item, index);
            }
          }
          return [].splice.apply(this, arguments);
        }
      };
      for (operation in _ref) {
        proxy = _ref[operation];
        array[operation] = mutable(proxy);
      }
      bindProp = function(item, i) {
        array.__values[i] = item;
        return Object.defineProperty(array, i, {
          get: function() {
            return this.__values[i];
          },
          set: mutable(function(val) {
            var _i, _len, _ref1, _results;
            this.__values[i] = val;
            _ref1 = this.__nodes;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              _results.push(node.replaceChild(createSectionItem(node, val, options), node.children[i]));
            }
            return _results;
          })
        });
      };
      Object.defineProperty(array, '__nodes', {
        enumerable: false,
        writable: true,
        value: []
      });
      Object.defineProperty(array, '__values', {
        enumerable: false,
        writable: true,
        value: []
      });
      for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
        item = array[i];
        bindProp(item, i);
      }
    }
    if (array.__nodes.indexOf(node) === -1) {
      array.__nodes.push(node);
    }
    return array;
  };

}).call(this);
