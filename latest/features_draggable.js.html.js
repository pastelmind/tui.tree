tui.util.defineNamespace("fedoc.content", {});
fedoc.content["features_draggable.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>'use strict';\nvar util = require('./../util');\n\nvar defaultOptions = {\n        useHelper: true,\n        helperPos: {\n            y: 2,\n            x: 5\n        }\n    },\n    rejectedTagNames = [\n        'INPUT',\n        'BUTTON',\n        'UL'\n    ],\n    API_LIST = [],\n    inArray = tui.util.inArray;\n\n/**\n * Set the tree draggable\n * @class Draggable\n * @constructor\n * @param {Tree} tree - Tree\n * @param {Object} options - Options\n *  @param {boolean} options.useHelper - Using helper flag\n *  @param {{x: number, y:number}} options.helperPos - Helper position\n *  @param {Array.&lt;string>} options.rejectedTagNames - No draggable tag names\n *  @param {Array.&lt;string>} options.rejectedClassNames - No draggable class names\n */\nvar Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{/*eslint-disable*/\n    static: {\n        /**\n         * @static\n         * @memberOf Selectable\n         * @returns {Array.&lt;string>} API list of Draggable\n         */\n        getAPIList: function() {\n            return API_LIST.slice();\n        }\n    },\n\n    init: function(tree, options) { /*eslint-enable*/\n        this.tree = tree;\n        this.setMembers(options);\n        this.attachMousedown();\n    },\n\n    /**\n     * Set members of this module\n     * @param {Object} options - input options\n     */\n    setMembers: function(options) {\n        var helperElement = document.createElement('span'),\n            style = helperElement.style;\n        options = tui.util.extend({}, defaultOptions, options);\n\n        this.useHelper = options.useHelper;\n        this.helperPos = options.helperPos;\n        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);\n        this.rejectedClassNames = [].concat(options.rejectedClassNames);\n        this.helperElement = helperElement;\n        this.userSelectPropertyKey = null;\n        this.userSelectPropertyValue = null;\n        this.currentNodeId = null;\n\n        style.position = 'absolute';\n        style.display = 'none';\n        this.tree.rootElement.parentNode.appendChild(helperElement);\n    },\n\n    /**\n     * Attach mouse down event\n     */\n    attachMousedown: function() {\n        this.preventTextSelection();\n        this.tree.on('mousedown', this.onMousedown, this);\n    },\n\n    /**\n     * Prevent text-selection\n     */\n    preventTextSelection: function() {\n        var tree = this.tree,\n            style = tree.rootElement.style,\n            selectKey = util.testProp(\n                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']\n            );\n\n        util.addEventListener(tree.rootElement, 'selectstart', util.preventDefault);\n\n        this.userSelectPropertyKey = selectKey;\n        this.userSelectPropertyValue = style[selectKey];\n        style[selectKey] = 'none';\n    },\n\n    /**\n     * Return whether the target element is in rejectedTagNames or in rejectedClassNames\n     * @param {HTMLElement} target - Target element\n     * @returns {boolean} Whether the target is not draggable or draggable\n     */\n    isNotDraggable: function(target) {\n        var tagName = target.tagName.toUpperCase(),\n            classNames = util.getClass(target).split(/\\s+/),\n            result;\n\n        if (inArray(tagName, this.rejectedTagNames) !== -1) {\n            return true;\n        }\n\n        tui.util.forEach(classNames, function(className) {\n            result = inArray(className, this.rejectedClassNames) !== -1;\n\n            return !result;\n        }, this);\n\n        return result;\n    },\n\n    /**\n     * Event handler - mousedown\n     * @param {MouseEvent} event - Mouse event\n     */\n    onMousedown: function(event) {\n        var target = util.getTarget(event),\n            tree = this.tree,\n            nodeId;\n\n        if (util.isRightButton(event) || this.isNotDraggable(target)) {\n            return;\n        }\n        util.preventDefault(event);\n\n        target = util.getTarget(event);\n        nodeId = tree.getNodeIdFromElement(target);\n        this.currentNodeId = nodeId;\n        if (this.useHelper) {\n            this.setHelper(target.innerText || target.textContent);\n        }\n\n        tree.on({\n            mousemove: this.onMousemove,\n            mouseup: this.onMouseup\n        }, this);\n    },\n\n    /**\n     * Event handler - mousemove\n     * @param {MouseEvent} event - Mouse event\n     */\n    onMousemove: function(event) {\n        var tree = this.tree,\n            helperEl = this.helperElement,\n            pos = tree.rootElement.getBoundingClientRect();\n        if (!this.useHelper) {\n            return;\n        }\n\n        helperEl.style.top = event.clientY - pos.top + this.helperPos.y + 'px';\n        helperEl.style.left = event.clientX - pos.left + this.helperPos.x + 'px';\n        helperEl.style.display = '';\n    },\n\n    /**\n     * Event handler - mouseup\n     * @param {MouseEvent} event - Mouse event\n     */\n    onMouseup: function(event) {\n        var tree = this.tree,\n            target = util.getTarget(event),\n            nodeId = tree.getNodeIdFromElement(target);\n\n        this.helperElement.style.display = 'none';\n        tree.move(this.currentNodeId, nodeId);\n        this.currentNodeId = null;\n\n        tree.off(this, 'mousemove');\n        tree.off(this, 'mouseup');\n    },\n\n    /**\n     * Restore text-selection\n     */\n    restoreTextSelection: function() {\n        var tree = this.tree;\n        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);\n        if (this.userSelectPropertyKey) {\n            tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;\n        }\n    },\n\n    /**\n     * Set helper contents\n     * @param {string} text - Helper contents\n     */\n    setHelper: function(text) {\n        this.helperElement.innerHTML = text;\n    },\n\n    /**\n     * Detach mousedown event\n     */\n    detachMousedown: function() {\n        this.tree.off(this);\n    },\n\n    /**\n     * Disable this module\n     */\n    destroy: function() {\n        this.restoreTextSelection();\n        this.detachMousedown();\n    }\n});\n\nmodule.exports = Draggable;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"