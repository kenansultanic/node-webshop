jQuery(document).ready(($) => {
    'use strict';

    const navclone = () => {
        $('.js-clone-nav').each(function () {
            let $this = $(this);
            $this.clone().attr('class', 'clone-view').appendTo('.mobile-view-body')
        })

        let body = $('body')

        body.on('click', '.js-toggle', (e) => {
            let $this = $(this)
            e.preventDefault()

            if (body.hasClass('off-view'))
                body.removeClass('off-view')
            else
                body.addClass('off-view')
        })

        $(document).mouseup((e) => {
            let container = $('.mobile-view')
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                if (body.hasClass('off-view'))
                    body.removeClass('off-view')
            }
        })

        $(window).resize(() => {
            let $this = $(this),
                w = $this.width()
            if (w > 768)
                if (body.hasClass('off-view'))
                    body.removeClass('off-view')
        })
    }
    navclone()
})