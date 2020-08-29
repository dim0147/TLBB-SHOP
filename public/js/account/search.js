$('document').ready(function(){


    $('.giaoluuArea').hide();
    $('#formSubmit').submit(function(e){

        let price = $('.range-track').data('slider').getValue();
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