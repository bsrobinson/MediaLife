
using System.Collections.Generic;
using System.Xml.Serialization;

namespace MediaLife.Models;

[XmlRoot(ElementName="vlm")]
public class VLCStreamStatus
{ 
	[XmlElement(ElementName="broadcast")] 
	public Broadcast? Broadcast { get; set; } 
}

[XmlRoot(ElementName="broadcast")]
public class Broadcast
{ 
	[XmlElement(ElementName="output")] 
	public required string Output { get; set; } 

	[XmlElement(ElementName="inputs")] 
	public required Inputs Inputs { get; set; } 

	[XmlElement(ElementName="instances")] 
	public required Instances Instances { get; set; } 

	[XmlAttribute(AttributeName="name")] 
	public required string Name { get; set; } 

	[XmlAttribute(AttributeName="enabled")] 
	public required string Enabled { get; set; } 

	[XmlAttribute(AttributeName="loop")] 
	public required string Loop { get; set; } 
}

[XmlRoot(ElementName="inputs")]
public class Inputs { 

	[XmlElement(ElementName="input")] 
	public required string Input { get; set; } 
}

[XmlRoot(ElementName="instances")]
public class Instances { 

	[XmlElement(ElementName="instance")] 
	public List<Instance> Instance { get; set; } = [];
}

[XmlRoot(ElementName="instance")]
public class Instance { 

	[XmlAttribute(AttributeName="name")] 
	public required string Name { get; set; } 

	[XmlAttribute(AttributeName="state")] 
	public required string State { get; set; } 

	[XmlAttribute(AttributeName="position")] 
	public double Position { get; set; } 

	[XmlAttribute(AttributeName="time")] 
	public int Time { get; set; } 

	[XmlAttribute(AttributeName="length")] 
	public int Length { get; set; } 

	[XmlAttribute(AttributeName="rate")] 
	public double Rate { get; set; } 

	[XmlAttribute(AttributeName="title")] 
	public int Title { get; set; } 

	[XmlAttribute(AttributeName="chapter")] 
	public int Chapter { get; set; } 

	[XmlAttribute(AttributeName="can-seek")] 
	public int CanSeek { get; set; } 

	[XmlAttribute(AttributeName="playlistindex")] 
	public int PlaylistIndex { get; set; } 
}

