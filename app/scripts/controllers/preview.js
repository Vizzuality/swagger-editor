'use strict';

SwaggerEditor.controller('PreviewCtrl', function PreviewCtrl(Builder,
  ASTManager, TagManager, Preferences, FoldStateManager,
  $scope, $rootScope, $stateParams, $sessionStorage, $http) {

  $scope.loadLatest = loadLatest;
  $scope.tagIndexFor = TagManager.tagIndexFor;
  $scope.getAllTags = TagManager.getAllTags;
  $scope.tagsHaveDescription = TagManager.tagsHaveDescription;
  $scope.getCurrentTags = TagManager.getCurrentTags;
  $scope.stateParams = $stateParams;
  $scope.isVendorExtension = isVendorExtension;
  $scope.showOperation = showOperation;
  $scope.showDefinitions = showDefinitions;
  $scope.responseCodeClassFor = responseCodeClassFor;
  $scope.showPath = showPath;
  $scope.foldEditor = FoldStateManager.foldEditor;
  $scope.listAllOperation = listAllOperation;
  $scope.listAllDefnitions = listAllDefnitions;
  $scope.loading = true;
  // Storage.addChangeListener('yaml', update);

  $http.get('/doc/swagger').then(function (data) {
    var json = JSON.stringify(data.data);
    Builder.buildDocs(json).then(onBuildSuccess, onBuildFailure);

  }, function () {
    $scope.error = true;
  });

  /**
   * Reacts to updates of YAML in storage that usually triggered by editor
   * changes
  */
  function update(latest, force) {
    if (!Preferences.get('liveRender') && !force && $scope.specs) {
      $rootScope.isDirty = true;
      $rootScope.progressStatus = 'progress-unsaved';
      return;
    }

    // Error can come in success callback, because of recursive promises
    // So we install same handler for error and success
    Builder.buildDocs(latest).then(onBuildSuccess, onBuildFailure);
  }

  /**
   * General callback for builder results
  */
  function onBuild(result) {

    $scope.$broadcast('toggleWatchers', true);  // turn watchers back on

    if (result.specs && result.specs.securityDefinitions) {
      var securityKeys = {};
      _.forEach(result.specs.securityDefinitions, function (security, key) {
        securityKeys[key] =
          SparkMD5.hash(JSON.stringify(security));
      });
      $sessionStorage.securityKeys = securityKeys;
    }

    $rootScope.$apply(function () {

      if (result.specs) {

        TagManager.registerTagsFromSpec(result.specs);

        // Retrive and put back fold state
        _.defaultsDeep(result.specs,
          FoldStateManager.getFoldedTree($rootScope.specs, result.specs));

        $rootScope.specs = result.specs;
      }
      $rootScope.errors = result.errors || [];
      $rootScope.warnings = result.warnings || [];
    });
  }

  /**
   * Callback of builder success
  */
  function onBuildSuccess(result) {
    onBuild(result);
    $scope.loading = false;
    $rootScope.$apply(function () {
      $rootScope.progressStatus = 'success-process';
    });

  }

  /**
   * Callback of builder failure
  */
  function onBuildFailure(result) {
    onBuild(result);
    $scope.loading = false;
    $scope.error = true;
  }

  /**
   * Loads the latest spec from editor value
  */
  function loadLatest() {
    update($rootScope.editorValue, true);
    $rootScope.isDirty = false;
  }

  /**
   * Response CSS class for an HTTP response code
   *
   * @param {number} code - The HTTP Response CODE
   *
   * @returns {string} - CSS class to be applied to the response code HTML tag
  */
  function responseCodeClassFor(code) {
    var colors = {
      2: 'green',
      3: 'blue',
      4: 'yellow',
      5: 'red'
    };
    return colors[Math.floor(+code / 100)] || 'default';
  }

  /**
   * Determines if a key is a vendor extension key
   * Vendor extensions always start with `x-`
   *
   * @param {string} key
   *
   * @returns {boolean}
  */
  function isVendorExtension(key) {
    return _.startsWith(key, 'x-');
  }

  /**
   * Determines if we should render the definitions sections
   *
   * @param {object|null} - the definitions object of Swagger spec
   *
   * @return {boolean} - true if definitions object should be rendered, false
   *  otherwise
  */
  function showDefinitions(definitions) {
    return angular.isObject(definitions);
  }

  /**
   * Determines if an operation should be shown or not
   * @param  {object} operation     the operation object
   * @param  {string} operationName the operation name in path hash
   * @return {boolean}              true if the operation should be shown
   */
  function showOperation(operation, operationName) {
    var currentTagsLength = TagManager.getCurrentTags() &&
      TagManager.getCurrentTags().length;

    if (isVendorExtension(operationName)) {
      return false;
    }

    if (operationName === 'parameters') {
      return false;
    }

    if (!currentTagsLength) {
      return true;
    }

    return operation.tags && operation.tags.length &&
      _.intersection(TagManager.getCurrentTags(), operation.tags).length;
  }

  /**
   * Determines if apath should be shown or not
   * @param  {object} path     the path object
   * @param  {string} pathName the path name in paths hash
   * @return {boolean}         true if the path should be shown
   */
  function showPath(path, pathName) {
    if (isVendorExtension(pathName)) {
      return false;
    }

    return _.some(path, showOperation);
  }

  /**
   * Folds all operation regardless of their current fold status
   *
  */
  function listAllOperation() {

    // unfold folded paths first
    _.each($scope.specs.paths, function (path, pathName) {
      if (_.isObject(path) && path.$folded === true) {
        path.$folded = false;
        FoldStateManager.foldEditor(['paths', pathName], false);
      }
    });

    _.each($scope.specs.paths, function (path, pathName) {
      _.each(path, function (operation, operationName) {
        if (_.isObject(operation)) {
          operation.$folded = true;
          FoldStateManager.foldEditor([
            'paths',
            pathName,
            operationName
          ], true);
        }
      });
    });
  }

  /**
   * Folds all definitions regardless of their current fold status
   *
  */
  function listAllDefnitions() {
    _.each($scope.specs.definitions, function (definition, definitionName) {

      if (_.isObject(definition)) {
        definition.$folded = true;
        FoldStateManager.foldEditor(['definitions', definitionName], true);
      }
    });
  }
});
