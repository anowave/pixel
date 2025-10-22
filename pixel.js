window.anowavePixel = (() => 
{
    return {
        attach: function(analytics, browser, init, config)
        {
            console.log(config);
            
            return this;
        }
    }
})();