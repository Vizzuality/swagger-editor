'use strict';

/**
 * Manages fold state of nodes in the YAML and preview pane
 * The state of the folds are kept in $rootScope.specs itself.
 */
SwaggerEditor.service('FoldStateManager',
  function FoldStateManager(ASTManager, $rootScope) {

    this.foldEditor = foldEditor;
    this.getFoldedTree = getFoldedTree;

    /**
     * Adds or removes a fold in Ace editor with given path
     *
     * @param {array<string>} path - a list of keys to reach to the node that
     * needs to be folded/unfolded
     *
     * @param {boolean} fold - true to fold the node and false to unfold it
     *
     */
    function foldEditor(path) {
      ASTManager.positionRangeForPath($rootScope.editorValue, path)
        .then(function () {

        });
    }

    /*
     * Get fold state tree of spec
     *
     * @param {object} tree
     * @param {object} newTree
     *
     * @returns {object}
     */
    function getFoldedTree(tree, newTree) {
      if (!tree) {
        return tree;
      }

      var result = {};

      _.keys(tree).forEach(function (key) {

        if (_.isObject(tree[key]) && _.isObject(newTree[key])) {
          result[key] = getFoldedTree(tree[key], newTree[key]);

        } else {
          if (key === '$folded') {
            result[key] = tree[key];
          } else {
            result[key] = newTree[key];
          }
        }

      });

      return result;
    }
  });
