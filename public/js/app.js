(function($) {
    'use strict';
    $(function() {
        $('a.confirm').click(function() {
            const el = $(this);
            return confirm(el.data('msg') || 'Emin misiniz?');
        });
    });
})(jQuery);
