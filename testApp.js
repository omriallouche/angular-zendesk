var zendeskApp = angular.module('zendeskApp', ['otZendesk']);

zendeskApp.config(["otZendeskConfigProvider","$qProvider", function (otZendeskConfigProvider,$qProvider) {
        otZendeskConfigProvider.config({
            baseUrl: 'https://otonomic.zendesk.com'
        });
        $qProvider.errorOnUnhandledRejections(false);
}]);

zendeskApp.controller('ZendeskController', function ZendeskController($scope, otZendeskService) {
    $scope.ticket = {
        subject : "Test subject",
        comment: "Text comment"
    };
    $scope.search = {
        query: ""
    };

    $scope.ticketResult = null;
    $scope.searchResult = null;
    
    $scope.searchArticles = function(){
        $scope.searchResult = null;
        $scope.search.loading = true;
        otZendeskService.searchArticles($scope.search.query).then(function(result){
            $scope.search.loading = false;
            $scope.searchResult = result;
        },
        function(){
            $scope.search.loading = false;
            $scope.searchResult = null;
        });
    };
    
    $scope.addTicket = function(){
        $scope.ticketResult = null;
        otZendeskService.addTicket($scope.ticket).then(function(){
            $scope.ticketResult = {OK : true};
        },
        function(){
            $scope.ticketResult = {OK : false};
        })
    }
});