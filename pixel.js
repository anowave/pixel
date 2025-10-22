window.anowave = (() => 
{
    return {
        attach: function(analytics, browser, init)
        {
            
            console.log(
                {
                    a: analytics, 
                    b: browser,
                    i: init
                }
            );

            return this;
        }
    }
})();