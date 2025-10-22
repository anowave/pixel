window.pixel = (() => 
{
    return {
        attach: function(analytics, config)
        {
            console.log(config);
            
            return this;
        }
    }
})();