import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import uuidV1 from 'uuid/v1';
import * as d3 from "d3";
import './font/iconfont.css';
import './ruleEditor.css';

const _ = require('lodash');
var Position = [0, 0];
class RuleEditor extends Component {
  constructor(props) {
    super(props);
    this.and = props.lang=='enUS' ? 'and': '与';
    this.or = props.lang=='enUS' ? 'or' : '或';
    this.values = {
      ids: 0,
      nodes: {},
      links: {},
      tests: {},
      height: this.props.height-2,

    };
    this.state = {
      contextmenu: null,
      ctxmenuPosition: [0, 0],
      hoverId : null,
    };
    this.testSet = this.testSet.bind(this);
    this.getTree = this.getTree.bind(this);
    this._resize = this._resize.bind(this);
    this.genTree = this.genTree.bind(this);
  }

  componentDidMount() {
    const self = this;
    let tmpOverNode = null;
    let tmpDragNodes, tmpDragLinks;
    let hadDrag = false;
    let isDragDel = false;
    this.drag = d3.drag()
      .on('start', function(d, i) {
        if (!self.props.editable) {
          return 
        }
        d3.select(this).each(function() {
          let firstChild = this.parentNode.parentNode.firstChild;
          if (firstChild) {
            this.parentNode.parentNode.insertBefore(this.parentNode, firstChild);
          }
          firstChild = this.parentNode.firstChild;
          if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
          }
        });
        tmpDragNodes = self.svg.selectAll('g.node')
          .filter(m => {
            let children = d.descendants().map(n => n.id);
            return children.indexOf(m.id)>=0;
          })


        tmpDragLinks = self.svg.selectAll('path.link')
          .filter(m => {
            let children = d.descendants().slice(1).map(n => n.id);
            return children.indexOf(m.id) >= 0;
          })
          .each(m => {
            m.dx = 0;
            m.dy = 0;
          })

        self.svg.selectAll('g.node')
          .filter(m => {
            // let l = this.values.links[d.rootId].map(j => j.id);
            let children = d.descendants().map(n => n.id);
            return m.data.type=='relation' && m.id!==d.id && children.indexOf(m.id)<0;
          })
          .append('circle')
          .attr('r', 30)
          .style('fill', 'rgba(226, 129, 134, 0.6)')
          .attr('class', 'anchorBk')
          .on('mouseover', function(d){
            tmpOverNode = d;
            d3.select(this).style('fill', 'rgba(47, 230, 65, 0.5)')
          })
          .on('mouseout', function(d) {
            d3.select(this).style('fill', 'rgba(226, 129, 134, 0.6)')
            tmpOverNode = null;
          })

      })
      .on('drag', function(d, i) {
        if (!self.props.editable) {
          return 
        }
        self.svg.selectAll('path.link')
          .filter(m => m.id==d.id)
          .attr('d', '')
        hadDrag = true;
        tmpDragNodes.attr('transform', d => {
          d.x += d3.event.dy;
          d.y += d3.event.dx;
          return `translate(${d.y}, ${d.x})`
        });
        tmpDragLinks.attr('transform', d => {
          d.dx += d3.event.dy;
          d.dy += d3.event.dx;
          return `translate(${d.dy}, ${d.dx})`
        });
      })
      .on('end', function(d) {
        if (!self.props.editable) {
          return 
        }
        self.svg.selectAll('circle.anchorBk')
          .remove();
        tmpDragLinks.each(m => {

        });
        if (tmpOverNode) {
          self._connectComp(tmpOverNode, d);
          tmpOverNode = null;
        }
        else if (isDragDel) {
          self._delComp(d);
        }
        else if (hadDrag) {
          d3.select(this.parentNode)
            .each(function(p) {
              self._disconnectComp(d, p);
            });
        }
        hadDrag = false;
      })

    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (d, i) => {
        this.values.height = this.props.height*d3.event.transform.k;
        this.update();
      });
    this.stratify = d3.stratify().id(d => d.id).parentId(d => d.parent);
    this.svg = d3.select(this.refs.svg)
      .selectAll('g')
      .data([{x: 0, y: 0}])
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
    d3.select('svg.ruleEditor').on('contextmenu', (d) => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        this.setState({
          contextmenu: [
            {name: '一键测试', action: this._testAll.bind(this)},
            // {name: '保存', action: this._save.bind(this)},
            {name: '提交', action: this._submit.bind(this)}
          ],
          ctxmenuPosition: d3.mouse(ReactDOM.findDOMNode(this.refs.ruleEditor))
        });
      })
      .on('click', () => {
        this.setState({
          contextmenu: null,
        });
      });
    this.trash = this.svg.append('text')
      .attr('font-family', 'rolefont')
      .attr('font-size', '32px')
      .style('fill', '#5AC9FE')
      .text('\ue73b')
      .style('background', 'none')
      .style('user-select', 'none')
      .style('-webkit-user-select', 'none')
      .style('-moz-user-select', 'none')
      .style('cursor', 'pointer')
      .on('click', () => {
        // console.log(this.props.confirm);
        this.props.confirm({
          title: '是否清空？',
          onOk: () => {
            this.values.links = {};
            this.values.nodes = {};
            this.update();
          },
          onCancel: () => {},
        });

      })
      .on('mouseover', function() {
        if (hadDrag) {
          d3.select(this).style('fill', 'rgba(204, 151, 148, 0.96)')
            .attr('font-size', '36px');
          isDragDel = true;
        }
      })
      .on('mouseout', function() {
        isDragDel = false;
        d3.select(this).style('fill', '#5AC9FE')
          .attr('font-size', '32px')
      });

    let rootW = ReactDOM.findDOMNode(this.refs.ruleEditor).getBoundingClientRect().width;
    if (!rootW) {
      this.waitDisplay = setInterval(() => {
        let rootW = ReactDOM.findDOMNode(this.refs.ruleEditor).getBoundingClientRect().width;
        if (rootW) {
          this._resize();
          this._initRule();
          clearInterval(this.waitDisplay);
        }
      }, 150);
    } else {
      this._resize(this.props.editable);

      this._initRule();
    }

    window.addEventListener('resize', this._resize.bind(this, this.props.editable));
    
    
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resize);
    if (this.waitDisplay) {
      clearInterval(this.waitDisplay);
    }
  }

  componentWillReceiveProps(nextProps) {
    let nextEles = nextProps.elements.map(i => i.id);
    this.props.elements.forEach(e => {
      if (nextEles.indexOf(e.id) < 0) {
        let children = _.keys(this.values.nodes).filter(i => this.values.nodes[i].display == e.id);
        this.values.nodes = _.omit(this.values.nodes, children);
        this.values.links = _.mapValues(this.values.links, o => {
          _.remove(o, i => children.indexOf(i.id)>=0);
          
          return o;
        });
        this.values.links = _.omitBy(this.values.links, i => i.length==0);
        this.update();
      }
    });

    if(this.props.editable !== nextProps.editable) {
      this._resize(nextProps.editable);
    }
  }


  _resize(editable) {
    let rootW = ReactDOM.findDOMNode(this.refs.ruleEditor).getBoundingClientRect().width;
    this.values.width = editable ? rootW - 202 : rootW;
    d3.select(this.refs.svg)
      .attr('width', this.values.width)
      .attr('height', this.values.height);

    this.trash.attr('x', this.values.width - 50)
      .attr('y', this.values.height - 30)
      .style('display', editable ? 'block' : 'none'); 
  }

  update() {
    let treesData = {};
    let rootData = _.chain(this.values.links)
      .toPairs()
      .map((d, i) => {
        let root = this.values.nodes[d[0]];
        let data = this.stratify(d[1])
          .sort((a, b) => (a.height - b.height)||a.id.localeCompare(b.id));

        data.descendants().forEach(item => item._children = item.children);
        let depth = _.maxBy(data.descendants(), o => o.depth).depth*60;
        let height = _.maxBy(data.descendants(), o => o.height).height*120;
        return {
          x: root.x*this.values.width,
          y: root.y*this.values.height - height/2,
          rootId: d[0],
          width: depth,
          height: height,
          data: data
        };
      })
      .sortBy((d) => (d.rootId))
      .value();
    let treesUpdate = this.svg.selectAll('g.rootNode')
      .data(rootData, (d) => d.rootId);
    let treesExit = treesUpdate.exit().remove();
    let treesEnter = treesUpdate.enter().append('g');
    let trees = treesEnter
      .merge(treesUpdate)
      .attr('class', 'rootNode')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)

      // .call(this.drag)


    let nodesUpdate = trees.selectAll('g.node')
      .data(d => {
        let tree = d3.tree().size([d.height, d.width]);
        return tree(d.data).descendants()
          // .sort((a, b) => parseInt(a.id) -parseInt(b.id))
      }, (d, i) => d.id + '_' + i)
    let nodesExit = nodesUpdate.exit().remove();
    let nodesEnter = nodesUpdate.enter().append('g');
    let nodes = nodesEnter
      .attr('class', 'node')
      .merge(nodesUpdate)
      .each(d => d.data = {...this.values.nodes[d.id], ...d.data})
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'move')
      .on('mouseover', d => {
        this.setState({hoverId: d.data.value.id});
      })
      .on('mouseout', d => {
        this.setState({hoverId: null});
      })
      .on('contextmenu', (d) => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        this.setState({
          contextmenu: [
            {name: '测试', action: () => {this._test(d)}},
          ],
          ctxmenuPosition: d3.mouse(ReactDOM.findDOMNode(this.refs.ruleEditor))
        });
      })
      .call(this.drag)

    nodesEnter.append('text')
      .attr('class', 'nodeTestRlt')
      .attr('font-family', 'rolefont')
      .attr('font-size', '12px')
      .attr('x', 10)
      .attr('y', -10)
      .style('cursor', 'pointer')
      .style('fill', (d) => {
        if (this.values.tests[d.id]) {
          return 'rgb(66, 203, 67)'
        }
        return 'rgb(208, 82, 64)'
      })
      .text((d) => {
        if (this.values.tests[d.id]) {
          return '\ue646'
        } else {
          return ''
        }
      })
      .on('mousedown', (d) => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        this.props.testGet(this.values.tests[d.id]);
      })

    nodesEnter.append('circle')
      .attr('r', 15)
      .style('fill', d => {
        return d.data.type == 'relation' ? '#34495e' : '#eee';
      })
      .style('stroke', d => {
        return d.data.type == 'relation' ? 'rgb(74, 159, 237)' : '#333';
      })
      .style('stroke-width', 0)

    nodesEnter.append('text')
      .text(d => {
        return d.data.display;
      })
      .attr('dy', 5)
      .style('text-anchor', 'middle')
      .style('fill', d => {
        return d.data.type == 'relation' ? '#fff' : '#555';
      })

    let linksUpdate = trees.selectAll('.link')
      .data(d => {
        let tree = d3.tree().size([d.height, d.width]);
        return tree(d.data).descendants().slice(0)
          // .sort((a, b) => parseInt(a.id) -parseInt(b.id))
      }, (d, i) => d.id + '_' + i);
    let linksExit = linksUpdate.exit().remove();
    // let linksUpdate =
    let linksEnter = linksUpdate.enter().append('path');
    let links = linksEnter.attr('class', 'link')
      .merge(linksUpdate)
      .attr('transform', d => `translate(${0}, ${0})`)
      .style('fill', 'none')
      .style('stroke', '#555')
      .style('stroke-opcity', 0.4)
      .style('stroke-width', 1.5)
      .attr('d', d => {
        if (d.parent) {
          return "M" + d.y + "," + d.x
              + "C" + (d.y + d.parent.y) / 2 + "," + d.x
              + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
              + " " + d.parent.y + "," + d.parent.x;
        }

      })
    this.svg.selectAll('path.link').each(function() {
      let firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    })

    this.svg.selectAll('text')
    .style('background', 'none')
    .style('user-select', 'none')
    .style('-webkit-user-select', 'none')
    .style('-moz-user-select', 'none')
  }

  genRole(comp) {
    if (!comp) {
      return null;
    }
    let role = (n) => {
      if (n.children) {
        let rlt = _.chain(n.children)
          .map(i => role(i))
          .filter(i => !!i)
          .value();
        return {
          children: rlt,
          // id: n.data.id,
          data: n.data.value,
          logicStr: n.data.display,
          logicExpression: `(${rlt.map(i => i.logicExpression).join(` ${n.data.value} `)})`
        }
        // return `(${rlt})`;
      }
      else if (n.data.type == 'role'){
        return {
          children: [],
          // id: n.data.id,
          data: n.data.value.data,
          logicStr: n.data.value.content,
          logicExpression: n.data.value.id,
        };
      }
      else {
        return null;
      }
    }
    return role(comp);
  }

  // genTree() {
  //   // let roles = this.props.defaultRole;

  // }
  genTree(rule='((A and B) or C)') {
    let links = [];
    let nodes = {};

    let lefts = [];
    let brackets = [];
    rule = rule.trim();
    _.each(rule, (i, index) => {
      if (i == '(') {
        lefts.push(index);
      } else if (i ==')') {
        let l = lefts.pop();
        let id = uuidV1();
        let e = rule.slice(l, index+1);
        let op = 'and';
        let eles = [];
        _.chain(brackets)
          .filter(b => b.start>l && b.end<index && !b.parent)
          .each(b => b.parent = id)
          .sortBy(['start'])
          .reverse()
          .each(b => {
            let left = e.slice(0, b.start-l);
            let right = e.slice(b.end-l+1);
            e = left + ' ' + b.id + right;
          })
          .map(b => {
            if (e.length > 0) {
              links.push({id: b.id, parent: id});
            }
          })
          .value();
        e = e.slice(1, e.length - 1).trim();
        if (e.length > 0) {
          let all = e.split(/ +/);
          eles = all.filter((item, index) => index%2==0);
          if (all.indexOf('or') > 0) {
            op = 'or';
          }
          eles.forEach(ele => {
            ele = ele.trim();
            if (ele.length!==36) {
              let eleId = uuidV1();
              nodes[eleId] = {
                display: ele,
                value: _.find(this.props.elements, j => j.id == ele),
                type: 'role',
                id: eleId,
                x: 0.1,
                y: 0.5,
              };
              links.push({
                id: eleId, parent: id,
              });
            }
          });
          nodes[id] = {
            display: op=='or'? this.or : this.and,
            value: op,
            id: id,
            type: 'relation',
            x: 0.1,
            y: 0.5
          };
          brackets.push({id:id, start:l, end: index});
        }
      }
    });
    let rootId = _.find(brackets, b => !b.parent).id;
    nodes[rootId].x = 0.1;
    nodes[rootId].y = 0.5;
    links.push({id: rootId, parent: ''});
    this.values.nodes = nodes;
    this.values.links[rootId] = links;
    this.update();
  }

  _trim(update=false) {
    let nodes = this.svg.selectAll('g.node')
      .filter(d => d.depth == 0)
      .data()

    let node = _.maxBy(nodes, (n) => n.descendants().length);
    if (update) {
      nodes.forEach(n => {
        if (n.id !== node.id) {
          this._delComp(n);
        }
      });
    }
    return node;
  }

  _test(comp) {
    let rules = _.chain([comp])
        .map(c => [c.data.id, this.genRole(c)])
        .fromPairs()
        .value();

    this.props.test(rules);
  }

  _testAll() {
    let n = this._trim();
    let rules = _.chain(n.descendants())
        .map(c => [c.data.id, this.genRole(c)])
        .fromPairs()
        .value();

    this.props.test(rules);
  }

  getTree() {
    let n = this._trim();
    let rules = _.chain(n.descendants())
        .map(c => [c.data.id, this.genRole(c)])
        .fromPairs()
        .value();
    return rules;
  }

  _save() {
    let n = this._trim(true);
    let role = this.genRole(n);
    this.props.save(role);
  }

  _submit() {
    let n = this._trim(true);
    let role = this.genRole(n);
    this.props.submit({
      testRlt: this.values.tests[n.id],
      rule: role,
    });
  }

  isTested() {
    let n = this._trim(true);
    return !!this.values.tests[n.id];
  }

  testSet(id, data) {
    this.values.tests[id] = data;
    this.svg.selectAll('g.node')
      .filter((d) => d.id == id)
      .select('text.nodeTestRlt')
      .style('fill', (d) => {
        console.log('fill', this.values.tests);
        if (this.values.tests[d.id]) {
          return 'rgb(66, 203, 67)'
        }
        return 'rgb(208, 82, 64)'
      })
      .text((d) => {
        if (this.values.tests[d.id]) {
          return '\ue646'
        } else {
          return '\ue68f'
        }
      })
  }

  _initRule() {
    const { elements, defaultRule } = this.props;
    // const defaultRule = {"data":"&","logicStr":"且","children":[{"data":"&","logicStr":"且","children":[{"children":[],"logicExpression":"A","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":23},{"children":[],"logicExpression":"B","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":24}],"logicExpression":"A&B"},{"children":[],"logicExpression":"C","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":25}],"logicExpression":"(A&B)&C","testResult":{"startDate":"2017-06-06 18:14","endDate":"2017-06-07 18:14","hitCount":"20","testCount":"20","result":[{"4017":"交易金额"},{"4017":"537955"},{"4017":"762654"},{"4017":"850117"},{"4017":"841061"},{"4017":"382833"},{"4017":"798536"},{"4017":"483690"},{"4017":"728939"},{"4017":"345433"},{"4017":"971973"}]}}
    let nodes = {};
    let links = [];
    let tree = (obj, parent) => {
      if (!obj || (!obj.data)) {
        return ;
      }
      let node = {
        id: uuidV1(),
      };
      if (obj.data == '&' || obj.data == 'and') {
        node.type = 'relation';
        node.value = 'and';
        node.display = this.and;
        node.x = 0.1;
        node.y = 0.5;
      } else if (obj.data == '|' || obj.data == 'or') {
        node.type = 'relation';
        node.value = 'or';
        node.display = this.or;
        node.x = 0.1;
        node.y = 0.5;
      } else {
        node.type = 'role';
        node.display = obj.logicExpression;
        node.value = _.find(elements, i => i.id==obj.logicExpression);
        node.x = 0.1;
        node.y = 0.5;
      }
      links.push({id: node.id, parent: parent});
      nodes[node.id] = node;
      obj.children.map(i => {
        tree(i, node.id);
      });
    };
    tree(defaultRule, '');
    let rootLink = _.find(links, i => !i.parent);
    if (rootLink) {
      this.values.nodes = nodes;
      this.values.links[rootLink.id] = links;
      this.values.tests[rootLink.id] = defaultRule.testResult;
      this.update();
    }
    // console.log(nodes, links);
  }

  _addComp(comp) {
    let id = uuidV1();
    this.values.nodes[id] = comp;
    this.values.links[id] = [{'id': id, 'parent': ''}];

    this.update();
  }

  _delComp(comp) {
    let children = comp.descendants().map(i => i.id);
    this.values.nodes = _.omit(this.values.nodes, children);
    if (comp.parent) {
      let anchor = _.last(comp.ancestors()).id;
      let cut = _.remove(this.values.links[anchor], n => children.indexOf(n.id) >= 0);
    }
    else {
      this.values.links = _.omit(this.values.links, [comp.id]);
    }
    this.update();
  }

  _disconnectComp(comp, p) {
    let node = this.values.nodes[comp.id];
    node.x = (comp.y+p.x) /this.values.width;
    node.y = (comp.x+p.y) / this.values.height;

    if (comp.parent) {
      let anchor = _.last(comp.ancestors()).id;
      let children = comp.descendants().map(j => j.id);
      let cut = _.remove(this.values.links[anchor], n => children.indexOf(n.id) >= 0);
      this.values.links[comp.id] = _.unionBy([{id: comp.id, parent:''}], cut, 'id');
    }
    this.update();
  }

  _connectComp(parent, child) {
    let parentId = parent.id;
    let childId = child.id;
    let parentAnchor = _.last(parent.ancestors()).id;

    if (_.keys(this.values.links).indexOf(childId) >= 0) {
      this.values.links[parentAnchor] = _.unionBy([{id: childId, parent: parentId}],
        this.values.links[childId], this.values.links[parentAnchor], 'id');
      this.values.links = _.omit(this.values.links, childId);
    }
    else {
      let childAnchor = _.last(child.ancestors()).id;
      let cut = _.remove(this.values.links[childAnchor], (n) => child.descendants().map(j => j.id).indexOf(n.id) >= 0);
      this.values.links[parentAnchor] = _.unionBy([{id: childId, parent: parentId}],
        cut, this.values.links[parentAnchor], 'id');
    }
    this.update();
  }

  _dragStart(event) {
    event.dataTransfer.setData('Text', '');
    document.addEventListener('dragover', this._dragOver, false);
  }

  _dragOver(event) {
    // event.preventDefault();
    Position = [event.clientX, event.clientY]
  }

  _dragEnd(data, event) {
    event.preventDefault();
    document.removeEventListener('dragover', this._dragOver, false);
    let s = ReactDOM.findDOMNode(this.refs.svg).getBoundingClientRect();
    let offsetX = Position[0] - s.left;
    let offsetY = Position[1] - s.top;
    let x = offsetX/s.width;
    let y = offsetY/s.height;
    if (x>=1 || x<=0 || y>=1 || y<=0) {
      return
    }

    this._addComp({
      x,
      y,
      ...data,
    });
  }

  _drop(event) {
    event.preventDefault();
  }



  _renderSide() {
    const {elements} = this.props;
    const {hoverId} =this.state;

    let rlt = elements.map((item, index) => {
      return <div draggable="true"
        style={{...styles.siderEle, background: hoverId == item.id ? '#5AC9FE' : '#eee'}}
        className="disSelect"
        onMouseOver={() => {this.setState({hoverId: item.id})}}
        onMouseOut={() => {this.setState({hoverId: null})}}
        onDragStart={this._dragStart.bind(this)}
        onDragEnd={this._dragEnd.bind(this, {
          type: 'role',
          value: item,
          display: item.id,
        })}
        key={index}>
        <span>{item.id}</span>
      </div>
    });
    return rlt;
  }

  render() {
    const { height, editable, lang } = this.props;
    const { hoverId, contextmenu, ctxmenuPosition } = this.state;
    let elements = this._renderSide();
    let message = hoverId ?(<div style={{...styles.message, maxWidth: this.values.width-200}}>
      {_.find(this.props.elements, (d) => d.id==hoverId).content}
    </div>) : null;

    let ctxmenu = null;
    let sider = null;

    if (editable) {
      sider = <div style={styles.sider} >
          <div style={{clear:'right', float: 'left', display: 'inline-block'}}>
            <div draggable="true"
              key={'and'}
              onDragStart={this._dragStart.bind(this)}
              onDragEnd={this._dragEnd.bind(this, {
                type: 'relation',
                value: 'and',
                display: this.and,
              })}
              className="disSelect"
              style={{...styles.siderEle, color: '#fff'}}>
              {this.and}
            </div>
            <div draggable="true"
              key={'or'}
              onDragStart={this._dragStart.bind(this)}
              onDragEnd={this._dragEnd.bind(this, {
                type: 'relation',
                value: 'or',
                display: this.or,
              })}
              className="disSelect"
              style={{...styles.siderEle, color: '#fff'}}>
              {this.or}
            </div>
          </div>
          <div style={{clear:'left', float: 'left', display: 'inline-block'}}>
          { elements }
          </div>
      </div>;

    }
    

    return <div style={{...styles.container, height}}
      className="rule-border"
      ref="ruleEditor">
      {sider}
      <svg  ref="svg"
        className="ruleEditor"
        style={styles.svg}/>
      { message }
    </div>
  }
}
const styles = {
    container: {
        width: '100%',
        background: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
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
      overflow: 'auto',
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
      cursor: 'move',
    },
    message: {
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
      right: 0,
      textAlign: 'center',
    },
    svg: {
      background: '#fff',
      position: 'absolute',
      right: 0,
      top: 0,
      borderLeftColor: '#eee',
      borderLeftWidth: 1,
      borderLeftStyle: 'solid',
      boxSizing: 'border-box',
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
      boxSizing: 'border-box',
    },
    operator: {
      background: 'rgba(233, 249, 204, 0.34)',
      width: 25,
      height: 25,
      borderRadius: 4,
      margin: 5,
    },
    contextMenu: {
      position: 'absolute',
      display: 'inline-block',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: 'rgba(214, 214, 214, 0.8)' ,
      boxSizing: 'border-box',
      padding: '0px 20px',
      background: '#fff',
    },
    contextItem: {
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '12px',
      padding:'5px 0'
    }
}

RuleEditor.propTypes = {
  height: PropTypes.number.isRequired,
  elements: PropTypes.array.isRequired,
  testRlt: PropTypes.array.isRequired,
  defaultRule: PropTypes.object.isRequired,
  test: PropTypes.func,
  save: PropTypes.func,
  testGet: PropTypes.func,
  submit: PropTypes.func,
  confirm: PropTypes.func,
  editable: PropTypes.bool,
  lang: PropTypes.string,
}

RuleEditor.defaultProps = {
  defaultRule: {"data":"&","logicStr":"且","children":[{"data":"&","logicStr":"且","children":[{"children":[],"logicExpression":"A","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":23},{"children":[],"logicExpression":"B","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":24}],"logicExpression":"A&B"},{"children":[],"logicExpression":"C","logicStr":"交易金额 大于 10000","data":{"leftOperand":"V_TRANS_AMOUNT","rightOperandVal":"10000","leftOperandFormat":"AMOUNT","rightOperandFormat":"STRING","leftOperandDemision":"TI","isVar":"num","rightOperandDemision":"","operator":">","uniqStr":"V_TRANS_AMOUNT>10000","uniqStrName":"交易金额 大于 10000"},"key":25}],"logicExpression":"(A&B)&C","testResult":{"startDate":"2017-06-06 18:14","endDate":"2017-06-07 18:14","hitCount":"20","testCount":"20","result":[{"4017":"交易金额"},{"4017":"537955"},{"4017":"762654"},{"4017":"850117"},{"4017":"841061"},{"4017":"382833"},{"4017":"798536"},{"4017":"483690"},{"4017":"728939"},{"4017":"345433"},{"4017":"971973"}]}},
  testRlt: [],
  height: 500,
  elements: [
              {'id': 'A', 'content': 'IP  ["192.168.0.1","192.168.0.2"]'},
              {'id': 'B', 'content': '城市人口 >= 10W'},
              {'id': 'C', 'content': 'CardId Age < 35'},
              {'id': 'D', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'E', 'content': '城市人口 >= 10W'},
              {'id': 'F', 'content': 'CardId Age < 35'},
              {'id': 'G', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'H', 'content': '城市人口 >= 10W'},
              {'id': 'I', 'content': 'CardId Age < 35'},
              {'id': 'J', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'K', 'content': '城市人口 >= 10W'},
              {'id': 'L', 'content': 'CardId Age < 35'},
              {'id': 'M', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'N', 'content': '城市人口 >= 10W'},
              {'id': 'O', 'content': 'CardId Age < 35'},
            ],
  test: () => {console.log('请设置正确的test属性')},
  save: () => {},
  testGet: () => {console.log('请设置正确的testGet属性')},
  submit: () => {console.log('请设置正确的submit属性')},
  confirm: window.confirm.bind(window),
  editable: false,
  lang: 'enUS'
}

export default RuleEditor;
