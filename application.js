angular.module('fiddleApp', ['ui.ace', 'ui.bootstrap']);

angular.module('fiddleApp')
  .factory('Gist', function($http) {
    function get(gistId) {
      return $http.get(gistId ? 'https://api.github.com/gists/'+ gistId : 'demo.json', {cache: true})
        .then(function (res) { return res.data.files; });
    }
    return { get: get };
  });

angular.module('fiddleApp')
  .factory('Files', function() {
    var mergeIndexHtml = function(files) {
      var scriptRegex = /<script[^>]+src=\"([\w\/\\.]*)\"*[^>]*>/g;
      var index = files['index.html'];
      if (!index) { throw 'No index.html defined'; }
      return index.content.replace(scriptRegex, function(match, fileName){
        return files[fileName] ? '<script>'+files[fileName].content : match;
      });
    };
    return { mergeIndexHtml: mergeIndexHtml };
  });

angular.module('fiddleApp')
  .directive('iframeResult', function() {
    return {
      restrict: 'E',
      scope: { content: '=' },
      link: function(scope, element) {
        scope.$watch('content', function(value) {
          var doc, iframe = document.createElement("iframe");
          iframe.id = "result";
          element.html('').append(angular.element(iframe));
          if (value) {
            if (iframe.contentDocument) doc = iframe.contentDocument;
            else if (iframe.contentWindow) doc = iframe.contentWindow.document;
            else doc = iframe.document;
            doc.open();
            doc.writeln(value);
            doc.close();
          }
        });
      }
    };
  });

angular.module('fiddleApp')
  .controller('MainCtrl', function($scope, $location, Files, Gist) {
    $scope.aceLoaded = function(editor) {
      editor.commands.addCommand({
        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec: function(editor) { $scope.execute(); }
      });
    };
    $scope.fetch = function(gistId){
      $scope.result = undefined;
      Gist.get(gistId || $scope.gistId).then(function(files) {
        $scope.files = files;
        $scope.execute();
      });
    };
    $scope.fetch($location.path().split('/').slice(-1)[0] || '9005905'); // Demo gist
    $scope.execute = function () {
      $scope.result = Files.mergeIndexHtml($scope.files);
      setTimeout(function() { preventDataLoose(); }, 500);
    };

    function preventDataLoose() {
      var iframe = document.getElementById('result');
      var resDoc = iframe.contentDocument || iframe.contentWindow.document;
      resDoc.onkeydown = function (e) { return preventBackspace(e); };
      var details = resDoc.getElementsByClassName('spec-detail');
      for (i = 0; i < details.length; i++) {
        var descriptions = details[i].getElementsByClassName('description');
        for (j = 0; j < descriptions.length; j++) {
          var link = descriptions[j].getElementsByTagName('a')[0];
          link.href = '#';
        }
      }
    }
  });

var preventBackspace = function preventBackspace(e) {
  if (!e) { e = window.event; }
  if (e.keyCode == 8) { return false; }
  return true;
};

document.addEventListener('DOMContentLoaded', function() {
  var iframe = document.getElementById('result');
  var resDoc = iframe.contentDocument || iframe.contentWindow.document;
  resDoc.onkeydown = function (e) { return preventBackspace(e); };
  document.onkeydown = function (e) { return preventBackspace(e); };
});
