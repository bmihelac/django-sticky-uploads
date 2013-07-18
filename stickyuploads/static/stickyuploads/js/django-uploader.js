/*
 * django-sticky-uploads widget
 * Source: https://github.com/caktus/django-sticky-uploads
 * Docs: http://django-sticky-uploads.readthedocs.org/
 *
 * Depends:
 *   - jQuery 1.7+
 *
 * Copyright 2013, Caktus Consulting Group, LLC
 * BSD License
 *
*/
;(function ($, window, document, undefined) {
    var pluginName = "djangoUploader",
        defaults = {
            url: "",
            before: null,
            success: null,
            failure: null,
            csrfCookieName: "csrftoken"
        };

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function getCookie(name) {
        var cookieValue = null,
            i = 0, cookies, cookie;
        if (document.cookie && document.cookie != "") {
            cookies = document.cookie.split(";");
            for (i = 0; i < cookies.length; i++) {
                cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function DjangoUploader(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    DjangoUploader.prototype = {

        init: function () {
            this.processing = false;
            this.$hidden = $(":input[type=hidden][name=_" + this.$element.attr("name")  + "]");
            this.$form = this.$element.parents('form').eq(0);
            this.$element.on("change", $.proxy(this.change, this));
            this.$form.on("submit", $.proxy(this.submit, this));
        },

        change: function (event) {
            var formData = new FormData(),
                i = 0, file;
            if (this.element.files.length === 0) {
                return;
            }
            for (i = 0; i < this.element.files.length; i += 1) {
                file = this.element.files[i];
                formData.append("upload", file);
            }
            if (this.before(formData) !== false) {
                this.processing = true;
                $.ajax({
                    url: this.options.url,
                    type: 'POST',
                    data: formData,
                    crossDomain: false,
                    beforeSend: $.proxy(this._add_csrf_header, this),
                    processData: false,
                    contentType: false
                }).done(
                    $.proxy(this.done, this)
                ).fail(
                    $.proxy(this.fail, this)
                ).always(
                    $.proxy(this.always, this)
                );
            }
        },

        before: function (formData) {
            // Runs before the AJAX call.
            // Returning false will abort the call.
            var result = true;
            if (this.options.before) {
                result = this.options.before.apply(this, [formData]);
            }
            return result;
        },

        always: function (response) {
            // Runs after the AJAX call regardless of success or failure.
            this.processing = false;
        },

        done: function (response) {
            // Runs on a successful (200) response
            if (response.is_valid && response.stored) {
                this.$hidden.val(response.stored);
            } else {
                this.$hidden.val('');
            }
            if (this.options.success) {
                this.options.success.apply(this, [response]);
            }
        },

        fail: function (response) {
            // Runs on a error (40X-50X) response
            this.$hidden.val('');
            if (this.options.failure) {
                this.options.success.failure(this, [response]);
            }
        },

        submit: function (event) {
            // Hijacked form submission
            if (this.processing) {
                event.preventDefault();
            } else {
                if (this.$hidden.val()) {
                    // Don't submit the file since its already on the server
                    this.$element.prop('disabled', true);
                }
            }
        },

        _add_csrf_header: function (xhr, settings) {
            var csrftoken = "";
            if (!csrfSafeMethod(settings.type)) {
                csrftoken = getCookie(this.options.csrfCookieName);
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new DjangoUploader(this, options));
            }
        });
    };

})(jQuery, window, document);