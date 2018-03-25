module.exports = {
  type: (check) => {
    try {
      let data = JSON.parse(check);
      let type = Object.prototype.toString.call(data).replace(/^\[\w+\s|\]$/g,'').toLowerCase();
      return {
        type,
        data: type == 'object' ? data : check
      };
    } catch(e) {
      return {
        is_object: false,
        data: check
      };
    }
  }
};
