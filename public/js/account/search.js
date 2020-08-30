$('document').ready(function(){


    $('.giaoluuArea').hide();
    $('#formSubmit').submit(function(e){
        let price = $('.range-track').data('slider').getValue(); 
        if(typeof price[0] !== 'number')
            price[0] = Number(price[0].replace(/[^0-9.-]+/g,""));
        if(typeof price[1] !== 'number')
            price[1] = Number(price[1].replace(/[^0-9.-]+/g,""));
        alert(price[0] + '|' + price[1]);
        $('#minPrice').val(price[0]);
        $('#maxPrice').val(price[1]);
    });

    $('#transaction_type').on('change', function() {
        if(this.value == 'sell'){
            $('.priceArea').show();
            $('.giaoluuArea').hide();
        }
        else{
            $('.giaoluuArea').show();
            $('.priceArea').hide();
        }
            
      });

    function getListItem(){
        return new Promise(function(resolve, reject){
            let listItems = [];
            $('.listItem').each(function(){
                listItems.push({slug:$(this).val(), id: $(this).attr('idItem')});
            });
            resolve(listItems);
        });
    }
});