'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

require('./font/iconfont.css');

require('./roleEditor.css');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Position = [0, 0];

var RoleEditor = function (_Component) {
  _inherits(RoleEditor, _Component);

  function RoleEditor(props) {
    _classCallCheck(this, RoleEditor);

    var _this = _possibleConstructorReturn(this, (RoleEditor.__proto__ || Object.getPrototypeOf(RoleEditor)).call(this, props));

    _this.and = props.lang == 'enUS' ? 'and' : '与';
    _this.or = props.lang == 'enUS' ? 'or' : '或';
    _this.values = {
      ids: 0,
      nodes: {},
      links: {},
      tests: {},
      height: _this.props.height - 2

    };
    _this.state = {
      contextmenu: null,
      ctxmenuPosition: [0, 0],
      hoverId: null
    };
    _this.testSet = _this.testSet.bind(_this);
    _this.getTree = _this.getTree.bind(_this);
    _this._resize = _this._resize.bind(_this);
    return _this;
  }

  _createClass(RoleEditor, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var self = this;
      var tmpOverNode = null;
      var tmpDragNodes = void 0,
          tmpDragLinks = void 0;
      var hadDrag = false;
      var isDragDel = false;
      this.drag = d3.drag().on('start', function (d, i) {
        if (!self.props.editable) {
          return;
        }
        d3.select(this).each(function () {
          var firstChild = this.parentNode.parentNode.firstChild;
          if (firstChild) {
            this.parentNode.parentNode.insertBefore(this.parentNode, firstChild);
          }
          firstChild = this.parentNode.firstChild;
          if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
          }
        });
        tmpDragNodes = self.svg.selectAll('g.node').filter(function (m) {
          var children = d.descendants().map(function (n) {
            return n.id;
          });
          return children.indexOf(m.id) >= 0;
        });

        tmpDragLinks = self.svg.selectAll('path.link').filter(function (m) {
          var children = d.descendants().slice(1).map(function (n) {
            return n.id;
          });
          return children.indexOf(m.id) >= 0;
        }).each(function (m) {
          m.dx = 0;
          m.dy = 0;
        });

        self.svg.selectAll('g.node').filter(function (m) {
          // let l = this.values.links[d.rootId].map(j => j.id);
          var children = d.descendants().map(function (n) {
            return n.id;
          });
          return m.data.type == 'relation' && m.id !== d.id && children.indexOf(m.id) < 0;
        }).append('circle').attr('r', 30).style('fill', 'rgba(226, 129, 134, 0.6)').attr('class', 'anchorBk').on('mouseover', function (d) {
          tmpOverNode = d;
          d3.select(this).style('fill', 'rgba(47, 230, 65, 0.5)');
        }).on('mouseout', function (d) {
          d3.select(this).style('fill', 'rgba(226, 129, 134, 0.6)');
          tmpOverNode = null;
        });
      }).on('drag', function (d, i) {
        if (!self.props.editable) {
          return;
        }
        self.svg.selectAll('path.link').filter(function (m) {
          return m.id == d.id;
        }).attr('d', '');
        hadDrag = true;
        tmpDragNodes.attr('transform', function (d) {
          d.x += d3.event.dy;
          d.y += d3.event.dx;
          return 'translate(' + d.y + ', ' + d.x + ')';
        });
        tmpDragLinks.attr('transform', function (d) {
          d.dx += d3.event.dy;
          d.dy += d3.event.dx;
          return 'translate(' + d.dy + ', ' + d.dx + ')';
        });
      }).on('end', function (d) {
        if (!self.props.editable) {
          return;
        }
        self.svg.selectAll('circle.anchorBk').remove();
        tmpDragLinks.each(function (m) {});
        if (tmpOverNode) {
          self._connectComp(tmpOverNode, d);
          tmpOverNode = null;
        } else if (isDragDel) {
          self._delComp(d);
        } else if (hadDrag) {
          d3.select(this.parentNode).each(function (p) {
            self._disconnectComp(d, p);
          });
        }
        hadDrag = false;
      });

      var zoom = d3.zoom().scaleExtent([0.5, 4]).on('zoom', function (d, i) {
        _this2.values.height = _this2.props.height * d3.event.transform.k;
        _this2.update();
      });
      this.stratify = d3.stratify().id(function (d) {
        return d.id;
      }).parentId(function (d) {
        return d.parent;
      });
      this.svg = d3.select(this.refs.svg).selectAll('g').data([{ x: 0, y: 0 }]).enter().append('g').attr('transform', function (d) {
        return 'translate(' + d.x + ', ' + d.y + ')';
      });
      d3.select('svg.ruleEditor').on('contextmenu', function (d) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        _this2.setState({
          contextmenu: [{ name: '一键测试', action: _this2._testAll.bind(_this2) },
          // {name: '保存', action: this._save.bind(this)},
          { name: '提交', action: _this2._submit.bind(_this2) }],
          ctxmenuPosition: d3.mouse(_reactDom2.default.findDOMNode(_this2.refs.roleEditor))
        });
      }).on('click', function () {
        _this2.setState({
          contextmenu: null
        });
      });
      this.trash = this.svg.append('text').attr('font-family', 'rolefont').attr('font-size', '32px').style('fill', '#5AC9FE').text('\uE73B').style('background', 'none').style('user-select', 'none').style('-webkit-user-select', 'none').style('-moz-user-select', 'none').style('cursor', 'pointer').on('click', function () {
        // console.log(this.props.confirm);
        _this2.props.confirm({
          title: '是否清空？',
          onOk: function onOk() {
            _this2.values.links = {};
            _this2.values.nodes = {};
            _this2.update();
          },
          onCancel: function onCancel() {}
        });
      }).on('mouseover', function () {
        if (hadDrag) {
          d3.select(this).style('fill', 'rgba(204, 151, 148, 0.96)').attr('font-size', '36px');
          isDragDel = true;
        }
      }).on('mouseout', function () {
        isDragDel = false;
        d3.select(this).style('fill', '#5AC9FE').attr('font-size', '32px');
      });

      var rootW = _reactDom2.default.findDOMNode(this.refs.roleEditor).getBoundingClientRect().width;
      if (!rootW) {
        this.waitDisplay = setInterval(function () {
          var rootW = _reactDom2.default.findDOMNode(_this2.refs.roleEditor).getBoundingClientRect().width;
          if (rootW) {
            _this2._resize();
            _this2._initRule();
            clearInterval(_this2.waitDisplay);
          }
        }, 150);
      } else {
        this._resize(this.props.editable);

        this._initRule();
      }

      window.addEventListener('resize', this._resize.bind(this, this.props.editable));
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('resize', this._resize);
      if (this.waitDisplay) {
        clearInterval(this.waitDisplay);
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _this3 = this;

      var nextEles = nextProps.elements.map(function (i) {
        return i.id;
      });
      this.props.elements.forEach(function (e) {
        if (nextEles.indexOf(e.id) < 0) {
          var children = _.keys(_this3.values.nodes).filter(function (i) {
            return _this3.values.nodes[i].display == e.id;
          });
          _this3.values.nodes = _.omit(_this3.values.nodes, children);
          _this3.values.links = _.mapValues(_this3.values.links, function (o) {
            _.remove(o, function (i) {
              return children.indexOf(i.id) >= 0;
            });

            return o;
          });
          _this3.values.links = _.omitBy(_this3.values.links, function (i) {
            return i.length == 0;
          });
          _this3.update();
        }
      });

      if (this.props.editable !== nextProps.editable) {
        this._resize(nextProps.editable);
      }
    }
  }, {
    key: '_resize',
    value: function _resize(editable) {
      var rootW = _reactDom2.default.findDOMNode(this.refs.roleEditor).getBoundingClientRect().width;
      this.values.width = editable ? rootW - 202 : rootW;
      d3.select(this.refs.svg).attr('width', this.values.width).attr('height', this.values.height);

      this.trash.attr('x', this.values.width - 50).attr('y', this.values.height - 30).style('display', editable ? 'block' : 'none');
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      var treesData = {};
      var rootData = _.chain(this.values.links).toPairs().map(function (d, i) {
        var root = _this4.values.nodes[d[0]];
        var data = _this4.stratify(d[1]).sort(function (a, b) {
          return a.height - b.height || a.id.localeCompare(b.id);
        });

        data.descendants().forEach(function (item) {
          return item._children = item.children;
        });
        var depth = _.maxBy(data.descendants(), function (o) {
          return o.depth;
        }).depth * 60;
        var height = _.maxBy(data.descendants(), function (o) {
          return o.height;
        }).height * 120;
        return {
          x: root.x * _this4.values.width,
          y: root.y * _this4.values.height - height / 2,
          rootId: d[0],
          width: depth,
          height: height,
          data: data
        };
      }).sortBy(function (d) {
        return d.rootId;
      }).value();
      var treesUpdate = this.svg.selectAll('g.rootNode').data(rootData, function (d) {
        return d.rootId;
      });
      var treesExit = treesUpdate.exit().remove();
      var treesEnter = treesUpdate.enter().append('g');
      var trees = treesEnter.merge(treesUpdate).attr('class', 'rootNode').attr('transform', function (d) {
        return 'translate(' + d.x + ', ' + d.y + ')';
      });

      // .call(this.drag)


      var nodesUpdate = trees.selectAll('g.node').data(function (d) {
        var tree = d3.tree().size([d.height, d.width]);
        return tree(d.data).descendants();
        // .sort((a, b) => parseInt(a.id) -parseInt(b.id))
      }, function (d, i) {
        return d.id + '_' + i;
      });
      var nodesExit = nodesUpdate.exit().remove();
      var nodesEnter = nodesUpdate.enter().append('g');
      var nodes = nodesEnter.attr('class', 'node').merge(nodesUpdate).each(function (d) {
        return d.data = _extends({}, _this4.values.nodes[d.id], d.data);
      }).attr('transform', function (d) {
        return 'translate(' + d.y + ', ' + d.x + ')';
      }).style('cursor', 'move').on('mouseover', function (d) {
        _this4.setState({ hoverId: d.data.value.id });
      }).on('mouseout', function (d) {
        _this4.setState({ hoverId: null });
      }).on('contextmenu', function (d) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        _this4.setState({
          contextmenu: [{ name: '测试', action: function action() {
              _this4._test(d);
            } }],
          ctxmenuPosition: d3.mouse(_reactDom2.default.findDOMNode(_this4.refs.roleEditor))
        });
      }).call(this.drag);

      nodesEnter.append('text').attr('class', 'nodeTestRlt').attr('font-family', 'rolefont').attr('font-size', '12px').attr('x', 10).attr('y', -10).style('cursor', 'pointer').style('fill', function (d) {
        if (_this4.values.tests[d.id]) {
          return 'rgb(66, 203, 67)';
        }
        return 'rgb(208, 82, 64)';
      }).text(function (d) {
        if (_this4.values.tests[d.id]) {
          return '\uE646';
        } else {
          return '';
        }
      }).on('mousedown', function (d) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        _this4.props.testGet(_this4.values.tests[d.id]);
      });

      nodesEnter.append('circle').attr('r', 15).style('fill', function (d) {
        return d.data.type == 'relation' ? '#34495e' : '#eee';
      }).style('stroke', function (d) {
        return d.data.type == 'relation' ? 'rgb(74, 159, 237)' : '#333';
      }).style('stroke-width', 0);

      nodesEnter.append('text').text(function (d) {
        return d.data.display;
      }).attr('dy', 5).style('text-anchor', 'middle').style('fill', function (d) {
        return d.data.type == 'relation' ? '#fff' : '#555';
      });

      var linksUpdate = trees.selectAll('.link').data(function (d) {
        var tree = d3.tree().size([d.height, d.width]);
        return tree(d.data).descendants().slice(0);
        // .sort((a, b) => parseInt(a.id) -parseInt(b.id))
      }, function (d, i) {
        return d.id + '_' + i;
      });
      var linksExit = linksUpdate.exit().remove();
      // let linksUpdate =
      var linksEnter = linksUpdate.enter().append('path');
      var links = linksEnter.attr('class', 'link').merge(linksUpdate).attr('transform', function (d) {
        return 'translate(' + 0 + ', ' + 0 + ')';
      }).style('fill', 'none').style('stroke', '#555').style('stroke-opcity', 0.4).style('stroke-width', 1.5).attr('d', function (d) {
        if (d.parent) {
          return "M" + d.y + "," + d.x + "C" + (d.y + d.parent.y) / 2 + "," + d.x + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x + " " + d.parent.y + "," + d.parent.x;
        }
      });
      this.svg.selectAll('path.link').each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
          this.parentNode.insertBefore(this, firstChild);
        }
      });

      this.svg.selectAll('text').style('background', 'none').style('user-select', 'none').style('-webkit-user-select', 'none').style('-moz-user-select', 'none');
    }
  }, {
    key: 'genRole',
    value: function genRole(comp) {
      if (!comp) {
        return null;
      }
      var role = function role(n) {
        if (n.children) {
          var rlt = _.chain(n.children).map(function (i) {
            return role(i);
          }).filter(function (i) {
            return !!i;
          }).value();
          return {
            children: rlt,
            // id: n.data.id,
            data: n.data.value,
            logicStr: n.data.display,
            logicExpression: '(' + rlt.map(function (i) {
              return i.logicExpression;
            }).join(' ' + n.data.value + ' ') + ')'
          };
          // return `(${rlt})`;
        } else if (n.data.type == 'role') {
          return {
            children: [],
            // id: n.data.id,
            data: n.data.value.data,
            logicStr: n.data.value.content,
            logicExpression: n.data.value.id
          };
        } else {
          return null;
        }
      };
      return role(comp);
    }

    // genTree() {
    //   // let roles = this.props.defaultRole;

    // }

  }, {
    key: 'genTree',
    value: function genTree() {
      var _this5 = this;

      var rule = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '((A and B) or C)';

      var links = [];
      var nodes = {};

      var lefts = [];
      var brackets = [];
      rule = rule.trim();
      _.each(rule, function (i, index) {
        if (i == '(') {
          lefts.push(index);
        } else if (i == ')') {
          var l = lefts.pop();
          var id = (0, _v2.default)();
          var e = rule.slice(l, index + 1);
          var op = 'and';
          var eles = [];
          _.chain(brackets).filter(function (b) {
            return b.start > l && b.end < index && !b.parent;
          }).each(function (b) {
            return b.parent = id;
          }).sortBy(['start']).reverse().each(function (b) {
            var left = e.slice(0, b.start - l);
            var right = e.slice(b.end - l + 1);
            e = left + ' ' + b.id + right;
          }).map(function (b) {
            if (e.length > 0) {
              links.push({ id: b.id, parent: id });
            }
          }).value();
          e = e.slice(1, e.length - 1).trim();
          if (e.length > 0) {
            var all = e.split(/ +/);
            eles = all.filter(function (item, index) {
              return index % 2 == 0;
            });
            if (all.indexOf('or') > 0) {
              op = 'or';
            }
            eles.forEach(function (ele) {
              ele = ele.trim();
              if (ele.length !== 36) {
                var eleId = (0, _v2.default)();
                nodes[eleId] = {
                  display: ele,
                  value: _.find(_this5.props.elements, function (j) {
                    return j.id == ele;
                  }),
                  type: 'role',
                  id: eleId,
                  x: 0.1,
                  y: 0.5
                };
                links.push({
                  id: eleId, parent: id
                });
              }
            });
            nodes[id] = {
              display: op == 'or' ? _this5.or : _this5.and,
              value: op,
              id: id,
              type: 'relation',
              x: 0.1,
              y: 0.5
            };
            brackets.push({ id: id, start: l, end: index });
          }
        }
      });
      var rootId = _.find(brackets, function (b) {
        return !b.parent;
      }).id;
      nodes[rootId].x = 0.1;
      nodes[rootId].y = 0.5;
      links.push({ id: rootId, parent: '' });
      this.values.nodes = nodes;
      this.values.links[rootId] = links;
      this.update();
    }
  }, {
    key: '_trim',
    value: function _trim() {
      var _this6 = this;

      var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var nodes = this.svg.selectAll('g.node').filter(function (d) {
        return d.depth == 0;
      }).data();

      var node = _.maxBy(nodes, function (n) {
        return n.descendants().length;
      });
      if (update) {
        nodes.forEach(function (n) {
          if (n.id !== node.id) {
            _this6._delComp(n);
          }
        });
      }
      return node;
    }
  }, {
    key: '_test',
    value: function _test(comp) {
      var _this7 = this;

      var rules = _.chain([comp]).map(function (c) {
        return [c.data.id, _this7.genRole(c)];
      }).fromPairs().value();

      this.props.test(rules);
    }
  }, {
    key: '_testAll',
    value: function _testAll() {
      var _this8 = this;

      var n = this._trim();
      var rules = _.chain(n.descendants()).map(function (c) {
        return [c.data.id, _this8.genRole(c)];
      }).fromPairs().value();

      this.props.test(rules);
    }
  }, {
    key: 'getTree',
    value: function getTree() {
      var _this9 = this;

      var n = this._trim();
      var rules = _.chain(n.descendants()).map(function (c) {
        return [c.data.id, _this9.genRole(c)];
      }).fromPairs().value();
      return rules;
    }
  }, {
    key: '_save',
    value: function _save() {
      var n = this._trim(true);
      var role = this.genRole(n);
      this.props.save(role);
    }
  }, {
    key: '_submit',
    value: function _submit() {
      var n = this._trim(true);
      var role = this.genRole(n);
      this.props.submit({
        testRlt: this.values.tests[n.id],
        rule: role
      });
    }
  }, {
    key: 'isTested',
    value: function isTested() {
      var n = this._trim(true);
      return !!this.values.tests[n.id];
    }
  }, {
    key: 'testSet',
    value: function testSet(id, data) {
      var _this10 = this;

      this.values.tests[id] = data;
      this.svg.selectAll('g.node').filter(function (d) {
        return d.id == id;
      }).select('text.nodeTestRlt').style('fill', function (d) {
        console.log('fill', _this10.values.tests);
        if (_this10.values.tests[d.id]) {
          return 'rgb(66, 203, 67)';
        }
        return 'rgb(208, 82, 64)';
      }).text(function (d) {
        if (_this10.values.tests[d.id]) {
          return '\uE646';
        } else {
          return '\uE68F';
        }
      });
    }
  }, {
    key: '_initRule',
    value: function _initRule() {
      var _this11 = this;

      var _props = this.props,
          elements = _props.elements,
          defaultRule = _props.defaultRule;
      // const defaultRule = {"data":"&","logicStr":"且","children":[{"data":"&","logicStr":"且","children":[{"children":[],"logicExpression":"A","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":23},{"children":[],"logicExpression":"B","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":24}],"logicExpression":"A&B"},{"children":[],"logicExpression":"C","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":25}],"logicExpression":"(A&B)&C","testResult":{"startDate":"2017-06-06 18:14","endDate":"2017-06-07 18:14","hitCount":"20","testCount":"20","result":[{"4017":"交易金额"},{"4017":"537955"},{"4017":"762654"},{"4017":"850117"},{"4017":"841061"},{"4017":"382833"},{"4017":"798536"},{"4017":"483690"},{"4017":"728939"},{"4017":"345433"},{"4017":"971973"}]}}

      var nodes = {};
      var links = [];
      var tree = function tree(obj, parent) {
        if (!obj || !obj.data) {
          return;
        }
        var node = {
          id: (0, _v2.default)()
        };
        if (obj.data == '&' || obj.data == 'and') {
          node.type = 'relation';
          node.value = 'and';
          node.display = _this11.and;
          node.x = 0.1;
          node.y = 0.5;
        } else if (obj.data == '|' || obj.data == 'or') {
          node.type = 'relation';
          node.value = 'or';
          node.display = _this11.or;
          node.x = 0.1;
          node.y = 0.5;
        } else {
          node.type = 'role';
          node.display = obj.logicExpression;
          node.value = _.find(elements, function (i) {
            return i.id == obj.logicExpression;
          });
          node.x = 0.1;
          node.y = 0.5;
        }
        links.push({ id: node.id, parent: parent });
        nodes[node.id] = node;
        obj.children.map(function (i) {
          tree(i, node.id);
        });
      };
      tree(defaultRule, '');
      var rootLink = _.find(links, function (i) {
        return !i.parent;
      });
      if (rootLink) {
        this.values.nodes = nodes;
        this.values.links[rootLink.id] = links;
        this.values.tests[rootLink.id] = defaultRule.testResult;
        this.update();
      }
      // console.log(nodes, links);
    }
  }, {
    key: '_addComp',
    value: function _addComp(comp) {
      var id = (0, _v2.default)();
      this.values.nodes[id] = comp;
      this.values.links[id] = [{ 'id': id, 'parent': '' }];

      this.update();
    }
  }, {
    key: '_delComp',
    value: function _delComp(comp) {
      var children = comp.descendants().map(function (i) {
        return i.id;
      });
      this.values.nodes = _.omit(this.values.nodes, children);
      if (comp.parent) {
        var anchor = _.last(comp.ancestors()).id;
        var cut = _.remove(this.values.links[anchor], function (n) {
          return children.indexOf(n.id) >= 0;
        });
      } else {
        this.values.links = _.omit(this.values.links, [comp.id]);
      }
      this.update();
    }
  }, {
    key: '_disconnectComp',
    value: function _disconnectComp(comp, p) {
      var node = this.values.nodes[comp.id];
      node.x = (comp.y + p.x) / this.values.width;
      node.y = (comp.x + p.y) / this.values.height;

      if (comp.parent) {
        var anchor = _.last(comp.ancestors()).id;
        var children = comp.descendants().map(function (j) {
          return j.id;
        });
        var cut = _.remove(this.values.links[anchor], function (n) {
          return children.indexOf(n.id) >= 0;
        });
        this.values.links[comp.id] = _.unionBy([{ id: comp.id, parent: '' }], cut, 'id');
      }
      this.update();
    }
  }, {
    key: '_connectComp',
    value: function _connectComp(parent, child) {
      var parentId = parent.id;
      var childId = child.id;
      var parentAnchor = _.last(parent.ancestors()).id;

      if (_.keys(this.values.links).indexOf(childId) >= 0) {
        this.values.links[parentAnchor] = _.unionBy([{ id: childId, parent: parentId }], this.values.links[childId], this.values.links[parentAnchor], 'id');
        this.values.links = _.omit(this.values.links, childId);
      } else {
        var childAnchor = _.last(child.ancestors()).id;
        var cut = _.remove(this.values.links[childAnchor], function (n) {
          return child.descendants().map(function (j) {
            return j.id;
          }).indexOf(n.id) >= 0;
        });
        this.values.links[parentAnchor] = _.unionBy([{ id: childId, parent: parentId }], cut, this.values.links[parentAnchor], 'id');
      }
      this.update();
    }
  }, {
    key: '_dragStart',
    value: function _dragStart(event) {
      event.dataTransfer.setData('Text', '');
      document.addEventListener('dragover', this._dragOver, false);
    }
  }, {
    key: '_dragOver',
    value: function _dragOver(event) {
      // event.preventDefault();
      Position = [event.clientX, event.clientY];
    }
  }, {
    key: '_dragEnd',
    value: function _dragEnd(data, event) {
      event.preventDefault();
      document.removeEventListener('dragover', this._dragOver, false);
      var s = _reactDom2.default.findDOMNode(this.refs.svg).getBoundingClientRect();
      var offsetX = Position[0] - s.left;
      var offsetY = Position[1] - s.top;
      var x = offsetX / s.width;
      var y = offsetY / s.height;
      if (x >= 1 || x <= 0 || y >= 1 || y <= 0) {
        return;
      }

      this._addComp(_extends({
        x: x,
        y: y
      }, data));
    }
  }, {
    key: '_drop',
    value: function _drop(event) {
      event.preventDefault();
    }
  }, {
    key: '_renderSide',
    value: function _renderSide() {
      var _this12 = this;

      var elements = this.props.elements;
      var hoverId = this.state.hoverId;


      var rlt = elements.map(function (item, index) {
        return _react2.default.createElement(
          'div',
          { draggable: 'true',
            style: _extends({}, styles.siderEle, { background: hoverId == item.id ? '#5AC9FE' : '#eee' }),
            className: 'disSelect',
            onMouseOver: function onMouseOver() {
              _this12.setState({ hoverId: item.id });
            },
            onMouseOut: function onMouseOut() {
              _this12.setState({ hoverId: null });
            },
            onDragStart: _this12._dragStart.bind(_this12),
            onDragEnd: _this12._dragEnd.bind(_this12, {
              type: 'role',
              value: item,
              display: item.id
            }),
            key: index },
          _react2.default.createElement(
            'span',
            null,
            item.id
          )
        );
      });
      return rlt;
    }
  }, {
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          height = _props2.height,
          editable = _props2.editable,
          lang = _props2.lang;
      var _state = this.state,
          hoverId = _state.hoverId,
          contextmenu = _state.contextmenu,
          ctxmenuPosition = _state.ctxmenuPosition;

      var elements = this._renderSide();
      var message = hoverId ? _react2.default.createElement(
        'div',
        { style: _extends({}, styles.message, { maxWidth: this.values.width - 200 }) },
        _.find(this.props.elements, function (d) {
          return d.id == hoverId;
        }).content
      ) : null;

      var ctxmenu = null;
      var sider = null;

      if (editable) {
        sider = _react2.default.createElement(
          'div',
          { style: styles.sider },
          _react2.default.createElement(
            'div',
            { style: { clear: 'right', float: 'left', display: 'inline-block' } },
            _react2.default.createElement(
              'div',
              { draggable: 'true',
                key: 'and',
                onDragStart: this._dragStart.bind(this),
                onDragEnd: this._dragEnd.bind(this, {
                  type: 'relation',
                  value: 'and',
                  display: this.and
                }),
                className: 'disSelect',
                style: _extends({}, styles.siderEle, { color: '#fff' }) },
              this.and
            ),
            _react2.default.createElement(
              'div',
              { draggable: 'true',
                key: 'or',
                onDragStart: this._dragStart.bind(this),
                onDragEnd: this._dragEnd.bind(this, {
                  type: 'relation',
                  value: 'or',
                  display: this.or
                }),
                className: 'disSelect',
                style: _extends({}, styles.siderEle, { color: '#fff' }) },
              this.or
            )
          ),
          _react2.default.createElement(
            'div',
            { style: { clear: 'left', float: 'left', display: 'inline-block' } },
            elements
          )
        );
      }

      return _react2.default.createElement(
        'div',
        { style: _extends({}, styles.container, { height: height }),
          className: 'rule-border',
          ref: 'roleEditor' },
        sider,
        _react2.default.createElement('svg', { ref: 'svg',
          className: 'ruleEditor',
          style: styles.svg }),
        message
      );
    }
  }]);

  return RoleEditor;
}(_react.Component);

var styles = {
  container: {
    width: '100%',
    background: '#fff',
    boxSizing: 'border-box',
    position: 'relative'
  },
  sider: {
    width: '200px',
    background: '#fff',
    height: '100%',
    float: 'left',
    position: 'relative',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    overflow: 'auto'
  },
  siderEle: {
    background: '#34495e',
    height: 36,
    width: 36,
    boxShadow: '0px 1px 5px #888888',
    float: 'left',
    boxSizing: 'border-box',
    borderRadius: 18,
    margin: '12px 12px',
    lineHeight: 2.6,
    fontSize: '14px',
    color: '#555',
    verticalAlign: 'middle',
    textAlign: 'center',
    cursor: 'move'
  },
  message: _defineProperty({
    background: '#eee',
    animationName: 'msgDisplay',
    animationDuration: '0.75s',
    color: '#555',
    textAlign: 'left',
    padding: 5,
    fontSize: '12px',
    position: 'absolute',
    margin: 'auto',
    wordWrap: 'break-word',
    bottom: 30,
    left: 0,
    right: 0
  }, 'textAlign', 'center'),
  svg: {
    background: '#fff',
    position: 'absolute',
    right: 0,
    top: 0,
    borderLeftColor: '#eee',
    borderLeftWidth: 1,
    borderLeftStyle: 'solid',
    boxSizing: 'border-box'
  },
  operators: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
    height: 60,
    padding: 10,
    fontSize: '13px',
    background: '#fff',
    boxSizing: 'border-box'
  },
  operator: {
    background: 'rgba(233, 249, 204, 0.34)',
    width: 25,
    height: 25,
    borderRadius: 4,
    margin: 5
  },
  contextMenu: {
    position: 'absolute',
    display: 'inline-block',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.8)',
    boxSizing: 'border-box',
    padding: '0px 20px',
    background: '#fff'
  },
  contextItem: {
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '12px',
    padding: '5px 0'
  }
};

RoleEditor.propTypes = {
  height: _propTypes2.default.number.isRequired,
  elements: _propTypes2.default.array.isRequired,
  testRlt: _propTypes2.default.array.isRequired,
  defaultRule: _propTypes2.default.object.isRequired,
  test: _propTypes2.default.func,
  save: _propTypes2.default.func,
  testGet: _propTypes2.default.func,
  submit: _propTypes2.default.func,
  confirm: _propTypes2.default.func,
  editable: _propTypes2.default.bool,
  lang: _propTypes2.default.string
};

RoleEditor.defaultProps = {
  defaultRule: { "data": "&", "logicStr": "且", "children": [{ "data": "&", "logicStr": "且", "children": [{ "children": [], "logicExpression": "A", "logicStr": "交易金额 大于 10000", "data": { "leftOperand": "V_TRANS_AMOUNT", "rightOperandVal": "10000", "leftOperandFormat": "AMOUNT", "rightOperandFormat": "STRING", "leftOperandDemision": "TI", "isVar": "num", "rightOperandDemision": "", "operator": ">", "uniqStr": "V_TRANS_AMOUNT>10000", "uniqStrName": "交易金额 大于 10000" }, "key": 23 }, { "children": [], "logicExpression": "B", "logicStr": "交易金额 大于 10000", "data": { "leftOperand": "V_TRANS_AMOUNT", "rightOperandVal": "10000", "leftOperandFormat": "AMOUNT", "rightOperandFormat": "STRING", "leftOperandDemision": "TI", "isVar": "num", "rightOperandDemision": "", "operator": ">", "uniqStr": "V_TRANS_AMOUNT>10000", "uniqStrName": "交易金额 大于 10000" }, "key": 24 }], "logicExpression": "A&B" }, { "children": [], "logicExpression": "C", "logicStr": "交易金额 大于 10000", "data": { "leftOperand": "V_TRANS_AMOUNT", "rightOperandVal": "10000", "leftOperandFormat": "AMOUNT", "rightOperandFormat": "STRING", "leftOperandDemision": "TI", "isVar": "num", "rightOperandDemision": "", "operator": ">", "uniqStr": "V_TRANS_AMOUNT>10000", "uniqStrName": "交易金额 大于 10000" }, "key": 25 }], "logicExpression": "(A&B)&C", "testResult": { "startDate": "2017-06-06 18:14", "endDate": "2017-06-07 18:14", "hitCount": "20", "testCount": "20", "result": [{ "4017": "交易金额" }, { "4017": "537955" }, { "4017": "762654" }, { "4017": "850117" }, { "4017": "841061" }, { "4017": "382833" }, { "4017": "798536" }, { "4017": "483690" }, { "4017": "728939" }, { "4017": "345433" }, { "4017": "971973" }] } },
  testRlt: [],
  height: 500,
  elements: [{ 'id': 'A', 'content': 'IP  ["192.168.0.1","192.168.0.2"]' }, { 'id': 'B', 'content': '城市人口 >= 10W' }, { 'id': 'C', 'content': 'CardId Age < 35' }, { 'id': 'D', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]' }, { 'id': 'E', 'content': '城市人口 >= 10W' }, { 'id': 'F', 'content': 'CardId Age < 35' }, { 'id': 'G', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]' }, { 'id': 'H', 'content': '城市人口 >= 10W' }, { 'id': 'I', 'content': 'CardId Age < 35' }, { 'id': 'J', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]' }, { 'id': 'K', 'content': '城市人口 >= 10W' }, { 'id': 'L', 'content': 'CardId Age < 35' }, { 'id': 'M', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]' }, { 'id': 'N', 'content': '城市人口 >= 10W' }, { 'id': 'O', 'content': 'CardId Age < 35' }],
  test: function test() {
    console.log('请设置正确的test属性');
  },
  save: function save() {},
  testGet: function testGet() {
    console.log('请设置正确的testGet属性');
  },
  submit: function submit() {
    console.log('请设置正确的submit属性');
  },
  confirm: window.confirm.bind(window),
  editable: false,
  lang: 'enUS'
};

exports.default = RoleEditor;