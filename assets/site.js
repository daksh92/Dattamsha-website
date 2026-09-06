document.addEventListener('DOMContentLoaded',function(){
  var m=document.querySelector('.nav .menu'),u=document.querySelector('.nav ul');
  if(m&&u){m.addEventListener('click',function(){u.classList.toggle('open');m.setAttribute('aria-expanded',u.classList.contains('open'));});}
  var f=document.querySelector('form[data-demo]');
  if(f){f.addEventListener('submit',function(e){
    if(f.getAttribute('action').indexOf('FORM_ID')>-1){e.preventDefault();
      var d=new FormData(f),body='Name: '+d.get('name')+'\nCompany: '+d.get('company')+'\nRole: '+d.get('role')+'\nHeadcount: '+d.get('headcount')+'\nRegion: '+d.get('region')+'\nDoor: '+d.get('door')+'\n\n'+d.get('message');
      location.href='mailto:daksh@dataproducts.co.in?subject='+encodeURIComponent('Demo request — '+d.get('company'))+'&body='+encodeURIComponent(body);}
  });}
});
