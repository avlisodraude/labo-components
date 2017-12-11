  /**
   * Set breadcrumbs in non react context
   * @param {object} data Data to export
   */
  export const setBreadCrumbs = (path) =>{    
    if (path && path.length){
      let result = '<li><a href="/" class="home"> </a> /</li>';
      path.forEach((p)=>{
        result += '<li><a href="/'+p+'">'+p+'</a> /</li>';
      });
      let elem = document.getElementById('breadcrumbs');
      if (elem){
        elem.innerHTML = result;
        elem.className = elem.className.replace('hidden', '');
      }
    }
  }