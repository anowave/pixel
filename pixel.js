window.anowavePixel = (() => 
{
    const gtm = (config, fn) => 
    {
        if (!!window.google_tag_manager)
        {
            fn();
        }
        else 
        {
            (function(w,d,s,l,i)
            {
                w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                
                var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                
                j.async=true;
                j.onload = () => 
                {
                    console.log("Anowave", config.container_id, "loaded");

                    window.dataLayer = window.dataLayer || [];

                    fn();
                }
                j.src = 'https://www.googletagmanager.com/gtm.js?id='+i+dl;
                
                f.parentNode.insertBefore(j,f);
            })
            (window,document,'script','dataLayer', config.container_id);
        }
    }

    return {
        attach: function(analytics, browser, init, config)
        {
            const fn = 
            {
                trackBeginCheckout: event => 
                {
                    const checkout = event?.data?.checkout;

                    let items = [], value = 0;
        
                    checkout?.lineItems.forEach(item => 
                    {
                        items.push
                        (
                            {
                                item_id:            item?.variant?.product?.id,
                                item_name:          item?.variant?.product?.title,
                                item_variant:       item?.variant?.title,
                                item_list_name:     'Checkout',
                                price:              item?.finalLinePrice?.amount,
                                currency:           item?.finalLinePrice?.currencyCode,
                                quantity:           item?.quantity
                            }
                        );
            
                        value += item?.finalLinePrice?.amount;
                    });
        
                    const payload = 
                    {
                        event: 'begin_checkout',
                        ecommerce: 
                        {
                            currency: event?.data?.checkout?.currencyCode,
                                items: items,
                                value: value
                        }
                    };
                
                    return payload;
                },
                trackAddShippingInfo: event => 
                {
                const checkout = event.data.checkout;

                    let items = [], value = 0;

                    checkout?.lineItems.forEach(item => 
                    {
                        items.push
                        (
                            {
                                item_id:            item?.variant?.product?.id,
                                item_name:          item?.variant?.product?.title,
                                item_variant:       item?.variant?.title,
                                item_category:      '',
                                price:              item?.finalLinePrice?.amount,
                                currency:           item?.finalLinePrice?.currencyCode,
                                quantity:           item?.quantity
                            }
                        );

                        value += item?.finalLinePrice?.amount;
                    });

                    const payload =
                    {
                        event: 'add_shipping_info',
                        ecommerce: 
                        {
                            currency:           checkout?.currencyCode,
                            items:              items,
                            shipping_tier:      checkout?.delivery?.selectedDeliveryOptions?.[0].title,
                            value:              value
                        }
                    }

                    return payload;
                },
                trackAddPaymentInfo: event => 
                {
                    const checkout = event.data.checkout;

                    let items = [], value = 0;

                    checkout?.lineItems.forEach(item => 
                    {
                        items.push
                        (
                            {
                                item_id:            item?.variant?.product?.id,
                                item_name:          item?.variant?.product?.title,
                                item_variant:       item?.variant?.title,
                                item_category:      '',
                                price:              item?.finalLinePrice?.amount,
                                currency:           item?.finalLinePrice?.currencyCode,
                                quantity:           item?.quantity
                            }
                        );

                        value += item?.finalLinePrice?.amount;
                    });

                    const firstDiscountType = checkout.discountApplications[0]?.type;

                    const discountCode = ['DISCOUNT_CODE','AUTOMATIC'].includes(firstDiscountType) ? checkout.discountApplications[0]?.title : null;

                    const payload = 
                    {
                        event: 'add_payment_info',
                        ecommerce: {
                            currency:       checkout?.currencyCode,
                            items:          items,
                            payment_type:   '',
                            value:          value,
                            coupon:         discountCode
                        }
                    };

                    return payload;
                },
                trackPurchase: event => 
                {
                    const checkout = event?.data?.checkout;
                
                    let items = [], value = 0;

                    const paymentTransactions = checkout.transactions.map(transaction => 
                    {
                        return {
                            paymentGateway: transaction.gateway,
                            amount:         transaction.amount,
                        };
                    });
                    
                    checkout?.lineItems.forEach(item => 
                    {
                        items.push
                        (
                            {
                                item_id:            item?.variant?.product?.id,
                                item_name:          item?.variant?.product?.title,
                                item_variant:       item?.variant?.title,
                                item_category:      '',
                                price:              item?.finalLinePrice?.amount,
                                currency:           item?.finalLinePrice?.currencyCode,
                                quantity:           item?.quantity
                            }
                        );
                    });

                    const discountCodes = checkout.discountApplications.map((discount) => 
                    {
                        if (discount.type === 'DISCOUNT_CODE') 
                        {
                            return discount.title;
                        }
                    });

                    const payload = 
                    {
                        event: 'purchase',
                        ecommerce: 
                        {
                            currency:               checkout?.currencyCode,
                            items:                  items,
                            transaction_id:         checkout?.order?.id,
                            coupon:                 '',
                            shipping:               checkout?.shippingLine?.price?.amount,
                            tax:                    checkout?.totalTax?.amount,
                            customer_type:          checkout?.order?.customer?.isFirstOrder ? 'new':'returning',
                            value:                  checkout?.totalPrice?.amount
                        }
                    }
                    
                    return payload;
                }
            }

            const events = 
            {
                checkout_started:                   (event)  => { return fn.trackBeginCheckout(event); },
                checkout_shipping_info_submitted:   (event)  => { return fn.trackAddShippingInfo(event); },
                payment_info_submitted:             (event)  => { return fn.trackAddPaymentInfo(event); },      
                checkout_completed:                 (event)  => { return fn.trackPurchase(event); }
            };

            Object.entries(events).forEach(([key, routine]) => 
            {
                analytics.subscribe(key, function (event) 
                {
                    (event => 
                    {
                        gtm(config, () => 
                        {
                            let payload = routine(event);

                            dataLayer.push({ ecommerce: null }); 
                            dataLayer.push(payload);

                            console.log("Anowave","Custom Pixel Push", dataLayer);

                        });
                    })(event);
                });
            });

            analytics.subscribe("checkout_completed", function (event) 
            {
                let items = [];

                const checkout = event?.data?.checkout;

                checkout?.lineItems.forEach(item => 
                {
                    items.push
                    (
                        {
                            item_id:            item?.variant?.product?.id,
                            item_name:          item?.variant?.product?.title,
                            item_variant:       item?.variant?.title,
                            price:              item?.finalLinePrice?.amount,
                            currency:           item?.finalLinePrice?.currencyCode,
                            quantity:           item?.quantity
                        }
                    );
                });

                const conversion = 
                {
                    send_to:          config.send_to,
                    value:            checkout.totalPrice?.amount,
                    currency:         checkout.currencyCode ,
                    transaction_id:   checkout.order?.id,
                    items:            items,
                    aw_merchant_id:   config.aw_merchant_id,
                    aw_feed_country:  config.aw_feed_country,
                    aw_feed_language: config.aw_feed_language,
                    aw_feed_label:    config.aw_feed_label,
                    new_customer:     true
                };

                (function(w, d, s, url, id) 
                {
                    var js = d.createElement(s); js.async = true; js.src = url + '?id=' + id;
                    var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(js, f);

                    js.onload = function() 
                    {
                        w.dataLayer = w.dataLayer || [];

                        function gtag(){ w.dataLayer.push(arguments); }

                        gtag('js', new Date());
                        gtag('config', id);
                        gtag('event', 'conversion', conversion);

                        console.debug("Anowave","Google Ads Conversion:", conversion);
                    };
                })(window, document, 'script', 'https://www.googletagmanager.com/gtag/js', config.measurement_id);
            }); 

            return this;
        }
    }
})();