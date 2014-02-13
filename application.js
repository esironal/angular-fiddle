angular.module('fiddleApp', ['ui.ace', 'ui.bootstrap']);

angular.module('fiddleApp')
    .factory('Files', function($http) {
        var files;
        var loadGist = function(gistId) {
            //return $http.get("data.json")
            return $http.get("https://api.github.com/gists/"+gistId)
                .then(function (res) {
                    files = res.data.files;
                    return files;
                });
        };
        var mergedIndexHtml = function() {
            var scriptRegex = /<script[^>]+src=\"([\w\/\\.]*)\"*[^>]*>/g;
            var index = files['index.html'];
            if (!index) { throw 'No index.html defined'; }
            return index.content.replace(scriptRegex, function(match, fileName){
                return files[fileName] ? '<script>'+files[fileName].content : match;
            });
        };
        return {
          loadGist: loadGist,
          mergedIndexHtml: mergedIndexHtml
        };
    })
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
    })
    .controller('MainCtrl', function($scope, Files) {
        $scope.aceLoaded = function(editor) {
            editor.commands.addCommand({
                bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                exec: function(editor) { $scope.execute(); }
            });
        };
        $scope.fetch = function(){
            $scope.result = '';
            Files.loadGist($scope.gistId).then(function(files) {
                $scope.files = files;
            });
        };
        $scope.execute = function () {
            $scope.result = Files.mergedIndexHtml();
        };
    });