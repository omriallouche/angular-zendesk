'use strict';
var otZendesk = angular.module('otZendesk', ["ui.bootstrap"]);

otZendesk.provider("otZendeskConfig", [function () {
        var _baseUrl = null;
        var _token = null;
        var _email = null;

        var _config = null;

        this.config = function (config) {
            _baseUrl = config.baseUrl;
            _token = config.token;
            _email = config.email;
        };

        this.$get = [function () {
                return {
                    baseUrl: _baseUrl,
                    token: _token,
                    email: _email
                };
            }];
    }]);
otZendesk.factory("otZendeskService", ['$http', '$q', 'otZendeskConfig', '$templateCache',
    function ($http, $q, otZendeskConfig, $templateCache) {
        if (!otZendeskConfig.baseUrl) {
            console.error("otZendesk error: Zendesk base url doesn't configured.");
        }
        var baseUrl = otZendeskConfig.baseUrl;
        var iframeRegex = /(<p>(<iframe.*<\/iframe>)<\/p>)/g;

        var articlesCache = {};

        var types = {
            all: "all",
            search: 'search',
            category: 'category',
            section: 'section',
            user: 'user',
            start_time: 'start_time'
        };

        var handlers = {};
        handlers[types.all] = searchAllArticles;
        handlers[types.search] = searchArticles;
        handlers[types.category] = getCategoriesArticles;
        handlers[types.section] = getSectionsArticles;
        handlers[types.user] = getUserArticles;
        handlers[types.start_time] = getIncrementalArticles;


        function addTicket(data) {
            if (!otZendeskConfig.token) {
                console.error("otZendesk error: Zendesk token is missing.");
                return $q.reject({});
            }
            if (!otZendeskConfig.email) {
                console.error("otZendesk error: Zendesk email is missing.");
                return $q.reject({});
            }

            if (!baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject({});
            }
            var url = baseUrl + '/api/v2/tickets.json?async=true';

            var email = otZendeskConfig.email;
            var t = otZendeskConfig.token;
            var authdata = btoa(email + '/token:' + t); // Encode to Base64. Does not support IE9 and lower

            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

            data.subject = data.subject || "New ticket";
            data.comment = data.comment || "";
            data.type = data.type || "task";
            data.priority = data.priority || "high";
            data.status = data.status || "open";
            data.tags = data.tags || "";
            data.submitter_id = data.submitter_id || 410989;
            data.requester_email = data.requester_email || 'support@otonomic.com';
            data.requester_name = data.requester_name || 'Zendesk Ticket Bot';
            data.custom_fields = !!data.custom_fields ? JSON.parse(data.custom_fields) : "";

            return $http.post(url, data);
        }

        function getArticles(type, id) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (handlers.hasOwnProperty(type)) {
                return handlers[type](id);
            }
            return $q.reject('There is no type: ' + type);
        }


        function searchArticles(query) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (isEmpty(query)) {
                return $q.reject('query is empty');
            }

            return $http.get(baseUrl + '/api/v2/help_center/articles/search.json?query=' + query)
                    .then(function (response) {
                        return response.data.results;
                    });
        }

        function searchAllArticles(count, page, all_results) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            count = count || 0;
            page = page || 1;
            all_results = all_results || [];

            return $http.get(baseUrl + '/api/v2/help_center/articles.json?sort_by=title&sort_order=asc&page=' + page)
                    .then(function (response) {
                        if (count < response.data.count) {
                            all_results = all_results.concat(response.data.articles);
                            count = count + response.data.articles.length;
                            page++;
                            return searchAllArticles(count, page, all_results);
                        }

                        return all_results;
                    });
        }

        function getCategoriesArticles(id) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (isEmpty(id)) {
                return $q.reject('id is empty');
            }
            return $http.get(baseUrl + '/api/v2/help_center/categories/' + id + '/articles.json')
                    .then(function (response) {
                        return response.data.articles;
                    });
        }

        function getSectionsArticles(id) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (isEmpty(id)) {
                return $q.reject('id is empty');
            }
            return $http.get(baseUrl + '/api/v2/help_center/sections/' + id + '/articles.json')
                    .then(function (response) {
                        return response.data.articles;
                    });
        }

        function getUserArticles(id) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (isEmpty(id)) {
                return $q.reject('id is empty');
            }
            return $http.get(baseUrl + '/api/v2/help_center/users/' + id + '/articles.json')
                    .then(function (response) {
                        return response.data.articles;
                    });
        }

        function getIncrementalArticles(startTime) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject([]);
            }
            if (!isNumeric(startTime)) {
                return $q.reject('startTime is not valid timestamp');
            }
            return $http.get(baseUrl + '/api/v2/help_center/incremental/articles.json?start_time=' + startTime)
                    .then(function (response) {
                        return response.data.articles;
                    });
        }

        function isEmpty(str) {
            return (!str || 0 === str.length);
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function getArticle(id, locale) {
            if (!otZendeskConfig.baseUrl) {
                console.error("otZendesk error: Zendesk base url is missing.");
                return $q.reject({});
            }
            if (isEmpty(id)) {
                return $q.reject('id is empty');
            }
            var localeParam = isEmpty(locale) ? '' : locale + '/';
            if (!articlesCache[localeParam + id]) {
                return $http.get(baseUrl + '/api/v2/help_center/' + localeParam + 'articles/' + id + '.json?include=users,sections')
                        .then(function (response) {
                            var article = response.data.article;
                            article.author = null;
                            article.section = null;
                            for (var i = 0; i < response.data.users.length; i++) {
                                if (response.data.users[i].id === article.author_id) {
                                    article.author = response.data.users[i];
                                }
                            }

                            for (var i = 0; i < response.data.sections.length; i++) {
                                if (response.data.sections[i].id === article.section_id) {
                                    article.section = response.data.sections[i];
                                }
                            }
                            ;
                            article.body = article.body.replace(iframeRegex, '<div class="embed-responsive embed-responsive-16by9">$2</div>');
                            articlesCache[localeParam + id] = article;
                            return article;
                        },
                                function () {
                                    return {body: '<p><b>Article with id ' + id + ' not found.</b></p>'}
                                });
            } else {
                return $q.resolve(articlesCache[localeParam + id]);
            }

        }


        return {
            getArticles: getArticles,
            getArticle: getArticle,
            addTicket: addTicket,
            searchArticles : searchArticles
        };
    }]
        );

otZendesk.directive('otZendeskArticle', function (otZendeskService) {
    return {
        restrict: 'E',
        template: '<div></div>',
        scope: {
            articleId: '@',
            locale: '@'
        },
        link: function (scope, element) {
            scope.locale = scope.locale || 'en-us';
            element.html('<div class="loadersmall" style="margin: 0 auto;"></div>');
            otZendeskService.getArticle(scope.articleId, scope.locale).then(function (item) {
                scope.item = item;
                scope.loaded = true;
                element.html(item.body);
                $compile(element.contents())(scope);
            });
        },
    }
});


otZendesk.directive('otZendeskTooltip', function ($compile, $templateCache, $sce, $timeout) {
    return {
        restrict: 'A',
        replace: false,
        terminal: true,
        priority: 1000,
        link: function (scope, element) {
            scope.locale = scope.locale || 'en-us';
            scope.popoverPlacement = scope.popoverPlacement || "bottom";

            var template = '<ot-zendesk-article article-id="{{articleId}}" locale="{{locale}}" ng-mouseenter="onMouseEnter($event)" ng-mouseleave="onMouseExit($event)"></zendesk-article>';
            $templateCache.put('zendeskTooltipTemplate.html', template);

            element.attr('uib-popover-template', "'zendeskTooltipTemplate.html'");
            element.attr('popover-is-open', "showPopover");
            element.attr('popover-append-to-body', "true");
            element.attr('popover-trigger', "manual");
            element.attr('popover-placement', scope.popoverPlacement);

            element.attr('ng-mouseenter', "onMouseEnter($event)");
            element.attr('ng-mouseleave', "onMouseExit($event)");

            element.removeAttr("ot-zendesk-tooltip"); //remove the attribute to avoid indefinite loop
            element.removeAttr("data-ot-zendesk-tooltip"); //also remove the same attribute with data- prefix in case users specify data-common-things in the html

            $compile(element)(scope);
        },
        controller: function ($scope) {
            var hidingTimeout = null;
            $scope.onMouseEnter = function (e) {
                $scope.showPopover = true;
                if (hidingTimeout)
                    $timeout.cancel(hidingTimeout);
            };

            $scope.onMouseExit = function (e) {
                hidingTimeout = $timeout(function () {
                    $scope.showPopover = false;
                }, 200);

            }
        },
        scope: {
            articleId: '@',
            locale: '@',
            popoverPlacement: "@"
        }
    };
});

otZendesk.directive('otZendeskArticlesAccordion', function (otZendeskService) {
    return {
        restrict: 'E',
        template: '<input type="text" class="zendesk-articles__search form-control" ng-model="searchText" placeholder="Type to search...">' +
                '<div class="loadersmall" style="margin:0 auto;" ng-if="articlesLoading"></div>' +
                '<div ng-repeat="item in items | filter:ContainsSearchText | orderBy:title track by $index" class="zendesk-articles__item">' +
                '<a class="zendesk-articles__item-title" data-toggle="collapse" data-target="#{{item.id}}" style="cursor:pointer;">{{item.title}}</a>' +
                '<ot-zendesk-article id="{{item.id}}" article-id="{{item.id}}" locale="{{item.locale}}" class="zendesk-articles__item-content collapse"></ot-zendesk-article>' +
                '</div>',
        scope: {
            by: '@',
            id: '@'
        },
        controller: function ($scope) {
            $scope.articlesLoading = true;
            $scope.ContainsSearchText = function (item) {
                if (!$scope.searchText) {
                    return 1;
                }
                var query = $scope.searchText.toLowerCase(), title = item.title.toLowerCase(), body = item.body.toLowerCase();
                return title.indexOf(query) >= 0 || body.indexOf(query) >= 0
            };

            otZendeskService.getArticles($scope.by, $scope.id)
                    .then(function (items) {
                        $scope.articlesLoading = false;
                        $scope.items = items;
                    },
                    function(){
                        $scope.articlesLoading = false;
                    })
        }
    }
});

otZendesk.directive('otZendeskArticles', function (otZendeskService) {
    return {
        restrict: 'E',
        template: '<ot-zendesk-article ng-repeat="item in items" article-id="{{item.id}}" locale="{{item.locale}}"></ot-zendesk-article>',
        scope: {
            by: '@',
            articleId: '@'
        },
        controller: function ($scope) {
            otZendeskService.getArticles($scope.by, $scope.articleId).then(function (items) {
                $scope.items = items;
            });
        }
    }
});