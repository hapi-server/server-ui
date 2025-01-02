if (typeof module !== 'undefined') {
  module.exports = _scriptList;
}

function _scriptList() {

  return [
    {label: "IDL", value: "idl"},
    {label: "IDL/SPEDAS", value:"idl-spedas"},
    {label: "Javascript", value:"javascript"},
    {label: "MATLAB", value:"matlab"},
    {label: "Python", value:"python"},
    {label: "Python/SPEDAS", value:"python-spedas"},
    {label: "Python/Kamodo", value:"python-kamodo"},
    {label: "Python/Kamodo-alt", value:"python-kamodo-alt"},
    {label: "Autoplot", value: "autoplot"},
    {label: "curl", value: "curl"},
    {label: "wget", value: "wget"}
  ];

}
