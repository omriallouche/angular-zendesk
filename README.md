# Angular Zendesk Directives & Service

## Getting started:
  - Include [Angular-UI Bootstrap](https://angular-ui.github.io/bootstrap/#/getting_started)
  - Include `spinner.css`:
```html
<link href="src/spinner.css" rel="stylesheet">
```
  - Include `otZendesk.js`:
```html
<script src="src/otZendesk.js"></script>
```
  - Include `otZendesk` module into your app:
```javascript
angular.module('yourApp', ['otZendesk'])
```
- Configure your Zendesk params with the `otZendeskConfigProvider`:
```javascript
myApp.config(["otZendeskConfigProvider", function (otZendeskConfigProvider) {
	otZendeskConfigProvider.config({
	    baseUrl: 'https://%YOURNAME%.zendesk.com', /* required*/
	    token: '%YOUR_TOKEN%', /* optional */
	    email: '%YOUR_EMAIL' /* optional */
	});
}]);
```

## Included Directives:

### Show Zendesk article
[Demo](https://omriallouche.github.io/angular-zendesk/demo/zendesk-article.html)

#### How to Use
```html
<ot-zendesk-article article-id="211790025"></ot-zendesk-article>
```
#### Attributes
* `article-id` - Article id
* `locale` - Article locale

### Show Zendesk article in tooltip
[Demo](https://omriallouche.github.io/angular-zendesk/demo/zendesk-article-tooltip.html)

#### How to Use
```html
<a href="#" ot-zendesk-tooltip="" article-id="211790065" popover-placement="bottom">Show Zendesk Tooltip</a>
```

#### Attributes:
* `article-id` - Article id
* `locale` - Article locale
* `popover-placement` - popover placement (`top`,`bottom`,`left` or `right`)

### Show Zendesk articles accordion
[Demo](https://omriallouche.github.io/angular-zendesk/demo/zendesk-articles-accordion.html)

#### How to Use
```html
<ot-zendesk-articles-accordion by="all"></ot-zendesk-articles-accordion>
```
#### Attributes:
* `by` - Parameter used to filter the articles. Possible values:
    - "all",
    - 'search',
    - 'category',
    - 'section',
    - 'user',
    - 'start_time'


### Search Zendesk articles
[Demo](https://omriallouche.github.io/angular-zendesk/demo/zendesk-articles-search.html)

#### How to Use
 - Inject `otZendeskService` into your controller or service
 - Use `otZendeskService.searchArticles ` function for articles search:
```javascript
	otZendeskService.searchArticles(searchQuery).then(function(result){
	$scope.searchResults = result;
}
```

### Submit a Zendesk ticket
[Demo](https://omriallouche.github.io/angular-zendesk/demo/submit-zendesk-ticket.html)

#### How to Use
 - Inject `otZendeskService` into your controller or service
 - Use `otZendeskService.addTicket` function
```javascript
	otZendeskService.addTicket(ticket).then(function(result){
}
```
Ticket object properties:
- `subject`
- `comment`
- `type`
- `priority`
- `status`
- `tags`
- `submitter_id`
- `requester_email`
- `requester_name`
- `custom_fields`
