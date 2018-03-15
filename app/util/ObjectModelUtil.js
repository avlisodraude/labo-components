//This utility should become the central place where all client-side application objects are ensured/validated!
//also merge with the toDummyData toTableObject functions (see different workspace components)
const ObjectModelUtil = {

	ensureProject : function(obj) {
		obj = !obj ? null : obj;
		return {
			id : obj.id || null,
			name : obj.name || null,
			description : obj.description || null,
			user : obj.user || null,
			created : obj.created || null,
			isPrivate : obj.isPrivate || true,
			queries : obj.queries || [],
			sessions : obj.sessions || []
		}
	},

	ensureProjectList : function(list) {
		list = !list ? [] : list;
		return list.map(p => ObjectModelUtil.ensureProject(p));
	},

	validateProject : function(obj) {
		return true
	}
}

export default ObjectModelUtil;