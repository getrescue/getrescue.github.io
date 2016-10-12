var Webchat = (function() {
  'use strict';

  return {
    createWebChat: createWebChat
  };

  function createWebChat(options) {
    var conversationPane = options.messages,
      form = options.form,
      sendButton = form.children('input[type="submit"]'),
      inputField = options.input,
      jsonDump = options.jsonDump,
      isFirstRequest = true,
      url = options.url,
      channelKey = getChannelKey(),
      integrationKey = '46xw2zwcxwjui5pud45xqj52v0lrm1dh7nebt23n',
      nlpServiceUrl = null,
      // GA related settings
      eventCategory = 'WebDemo',
      eventLabel = 'AngelHomepage',
      trackEvents = options.trackEvents || false;


    if (!conversationPane || !inputField || !form || !jsonDump
      || !jsonDump.normalized_entities || !jsonDump.raw_entities || !url) {
      return console.error('createWebChat requires all params to be passed in.');
    }

    if ($('#nlp-service-selector').length) {
        nlpServiceUrl = $('#nlp-service-selector').val();
        $('#nlp-service-selector').change(function() {
            nlpServiceUrl = this.value;
        });
    }
    if ($('#backend-selector').length) {
        url = $('#backend-selector').val();
        $('#backend-selector').change(function() {
            url = this.value;
        });
    }

    init();

    function init() {
      form.submit(function(event) {
        event.preventDefault();
        sendMessage(inputField.val());
      })
      form.children('input[type="submit"]').prop('disabled', false);
    }

    function sendMessage(message) {
      message = message.trim();
      if (message === '') {
        return console.error('cannot send empty message');
      }
      addMessageToDom(true, message);
      startLoading();
      $.ajax({
        url: url,
        method: 'POST',
        contentType: "application/json",
        data: JSON.stringify({
          message_text: message,
          channel_key: getChannelKey(),
          new_ticket: isFirstRequest,
          nlp_service_url: nlpServiceUrl || null,
          integration_key: integrationKey
        }),
        dataType: "json"
      }).done(function(response) {
        onMessageSendSuccess(response.channel_key, response.messages, response.data)
      }).fail(function() {
        console.error("Failed to send message please try again!");
      }).always(function() {
        form.children('input[type="submit"]').prop('disabled', false);
        stopLoading();
      });
    }

    /**
     * Adds a message to the conversation pane
     * @param {Boolean} fromUser
     * @param {String}  message
     */
    function addMessageToDom(fromUser, message) {
      var messageElem = createMessageElem(fromUser, message);
      conversationPane.append(messageElem);
      scrollToBottom();
    }

    function createMessageElem(fromUser, message) {
      var messageBodyElem = $('<div class="message-body"></div>').html(message),
        messageElem = $('<div class="message"></div>').append(messageBodyElem);
      if (fromUser) {
        messageElem.addClass('user-message');
      }
      return messageElem;
    }

    function onMessageSendSuccess(chanKey, messages, data) {
      var filteredData;
      if (trackEvents) {
        if (!getChannelKey()) {
          ga('set', 'userId', chanKey); // Set the user ID using signed-in user_id.
          ga('send', 'event', eventCategory, 'firstSendMessage', eventLabel);
        }
        ga('send', 'event', eventCategory, 'sendMessage', eventLabel);
      }
      isFirstRequest = false;
      setChannelKey(chanKey);
      if (messages != undefined) {
        messages.forEach(function(message) {
          addMessageToDom(false, message.text);
        });
      }

      inputField.val('');
      if (data) {
        filteredData = filterUglyEntities(data);
        dumpRawData(filteredData);
        dumpNormalizedData(filteredData);
      }
    }

    function startLoading() {
      var messageElem = createMessageElem(false, '...').addClass('loading');
      conversationPane.append(messageElem);
      scrollToBottom();
      sendButton.prop('disabled', true);
    }

    function stopLoading() {
      $('.message.loading').remove();
      scrollToBottom();
      sendButton.prop('disabled', false);
    }

    function addDumpDataToDiv(div, dumpData, intent) {
      var entity, row,
        keys = Object.keys(dumpData).sort();
      keys.forEach(function(k) {
        if (dumpData[k].constructor === Array && intent == 'request_product') {
          var count = 0
          dumpData[k].forEach(function(l) {
            count += 1
            addProductHeadingToDiv(div, count);
            Object.keys(l).forEach(function(m){
              addToDiv(div, m, l[m], (intent == 'request_product'));
            });
          });
        }
        else {
            addToDiv(div, k, dumpData[k]);
        }
      });
    }

    function addToDiv(div, entityName, entityData, indent) {
      var indent = typeof indent !== 'undefined' ?  indent : false;
      var entity = toTitleCase(entityName.replace(/_/g, ' '));

      var entityCol;
      if (indent) {
        entityCol = $('<td/>').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp' + entity);
      }
      else {
        entityCol = $('<td/>').text(entity);
      }

      var valCol = $('<td/>').text(entityData);
      var row = $('<tr/>').append(entityCol).append(valCol);
      div.append(row);
    }

    function addProductHeadingToDiv(div, productCount) {
      var productCol = $('<td/>').text('Product #' + productCount);
      var row = $('<tr/>').append(productCol);
      div.append(row);
    }


    function dumpRawData(filteredData) {
      jsonDump.raw_entities.empty();
      addToDiv(jsonDump.raw_entities, 'Domain', filteredData.domain);
      addDumpDataToDiv(jsonDump.raw_entities, filteredData.raw_entities, filteredData.intent);
    }

    function dumpNormalizedData(filteredData) {
      jsonDump.normalized_entities.empty();
      addToDiv(jsonDump.normalized_entities, 'Domain', filteredData.domain);
      addDumpDataToDiv(jsonDump.normalized_entities, filteredData.normalized_entities, filteredData.intent);
    }

    function scrollToBottom() {
      conversationPane.scrollTop(conversationPane[0].scrollHeight);
    }

    function getChannelKey() {
      return channelKey || Cookies.get('channelKey') || null;
    }

    function setChannelKey(chanKey) {
      channelKey = chanKey;
      Cookies.set('channelKey', chanKey, {
        expires: Infinity
      });
    }

    function toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    function filterUglyEntities(req) {
        delete req.raw_entities.round_trip;
        delete req.normalized_entities.airline;
        delete req.normalized_entities.nonstop;

        return req;
    }
  }
})();
