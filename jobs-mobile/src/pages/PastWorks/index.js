import React, {useState, useContext, useEffect} from 'react';
import {Text, View, Image, FlatList, TouchableOpacity, Alert, ImageBackground, TextInput, Modal} from 'react-native';
import {EvilIcons, Ionicons, FontAwesome, 
    FontAwesome5} from '@expo/vector-icons';
import {isBefore, getDate, getDay, formatRelative, parseISO} from 'date-fns'
import { zonedTimeToUtc, format } from 'date-fns-tz';
import StarRating from 'react-native-star-rating';

import anonimusImage from '../../assets/anonimo.png';
import backgroundPattern from '../../assets/backgroundPattern.png';
import api from '../../services/api';
import { userContext } from '../../contexts/UserContext';
import styles from './styles';

export default function OpenWorks({navigation}){

    const {loadWorks, works, token} = useContext(userContext);
    const [newWorks, setNewWorks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [starCount, setStarCount] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewRequiredShow, setReviewRequiredShow] = useState(false);
    const [currentWork, setCurrentWork] = useState(null);
    const [resultMessage, setResultMessage] = useState('');
    var day = []
    useEffect(() => {
        loadWorks();
    }, []);

    useEffect(() => {
        const newWorks = works.map(async work => {
        const response = await api.get(`/babysitter/${work.nanny}`,{
            headers:{
                authorization : `Bearer ${token}`
            }
        });

       // console.log(response.data);
        
        work.nannyProfile = response.data;
        return work;
    });

    Promise.all(newWorks).then(newWorks =>  setNewWorks(newWorks))

    }, [works])

    useEffect(() => {
        if(modalVisible == false){
            if(resultMessage != ''){
                Alert.alert(
                    resultMessage,
                    '',
                    [
                      {text: 'Take a look', onPress: () => navigation.navigate('NannyReviews',{'nanny': currentWork.nannyProfile})},
                      {text: 'OK', onPress: () => console.log('OK Pressed')},
                    ],
                    {cancelable: false},
                  );
                setResultMessage('')  
            }
        }
    }, [modalVisible])
    async function handleSubmit(){
        if(reviewText == ''){
            setReviewRequiredShow(true);
            return;
        }
        console.log(currentWork);
        
        try{
        const response = await api.post('/valorate',{
            message: reviewText,
            stars: starCount
        }, {
            headers:{
                authorization: `Bearer ${token}`,
                babysitterId: currentWork.nanny,
                userId: currentWork.family,
                workId: currentWork._id
            }
        });
        console.log(response.data);
        const works = newWorks.map(work => {
            if(work._id === currentWork._id){
                work.reviewed = true;
            }
            return work;
        })
        setNewWorks(works);
        setResultMessage('Your review was added!');
    } catch(err){
        setResultMessage('Error ocurred, try again');
        console.log(err);
        
    } finally{
        setReviewRequiredShow(false);
        setReviewText('');
        setStarCount(0);   
        setModalVisible(false);
    }
    }

    return (
        <View style={styles.container}>
            <ImageBackground source={backgroundPattern} style={{height: '100%', width: '100%', position: 'absolute'}}></ImageBackground>
            
        <FlatList
        style={styles.worksList}
        data={newWorks.sort((a, b) => { 
                if(isBefore(b.dateHourStartDateFormat, a.dateHourStartDateFormat)){
                    return -1;
                }
                else{
                    return 1;
                }
            })}
        keyExtractor={ work => String(work._id)}
        showsVerticalScrollIndicator={false}
        renderItem={({item : work, index}) => {
            day = [...day, getDate(work.dateHourStartDateFormat)];
            
            return ( 
                
                    isBefore(work.dateHourStartDateFormat, new Date()) ?
                    <View>
                    {
                    index != 0 && day[index-1] == getDate(work.dateHourStartDateFormat) ?
                     null : 
                     <View style={styles.subtitle}>
                        <Text  style={styles.subtitleText}>{format(work.dateHourStartDateFormat, 'EEEE') }</Text>
                        <Text  style={[styles.subtitleText, {marginRight: 5}]}>{format(work.dateHourStartDateFormat, 'dd/MM/yyyy') }</Text>
                    </View>
                    }
                    <View style={[styles.babysitterItem]} >
                            <View style={styles.avatarContainer}>
                                { work.nannyProfile.photo.length > 0 ?
                                <Image style={styles.imageBabysitter} source={{uri : `http://10.0.0.18:3333/static/${work.nannyProfile.photo}`}}/> 
                                :
                                <Image style={styles.imageBabysitter} source={anonimusImage}/>
                            }
                            </View>
                            <View style={styles.babysitterInfo}>
                                <TouchableOpacity onPress={() => navigation.navigate('SavedNannyProfile', {'worker' : work.nannyProfile})}>
                                    <Text style={styles.infoText}>{work.nannyProfile.name}</Text>
                                </TouchableOpacity>
                                <View style={styles.dateRow}>
                                <Text style={styles.ageText}>From:</Text>
                                <Text style={[styles.ageText, {marginLeft: 10}]}>{format(work.dateHourStartDateFormat, 'HH:mm:ss')}</Text>
                                </View>
                                <View style={styles.dateRow}>
                                <Text style={styles.ageText}>To:</Text>                     
                                <Text style={[styles.ageText, {marginLeft: 10}]}>{work.dateHourFinishReadable}</Text>                     
                                </View>
                                <View style={styles.rateBox}>
                                        <Text style={styles.ageText}>Paid:</Text>
                                        <FontAwesome name='shekel' size={15} style={[styles.shekel, {marginLeft: 10}]} ></FontAwesome>
                                        <Text style={styles.ageText}>{work.defined_value_to_pay}/h</Text>    
                                </View>  
                            </View>
                            {work.reviewed == true ? null 
                            :
                            <TouchableOpacity style={styles.reviewButton} onPress={() => {
                                setCurrentWork(work);
                                setModalVisible(true);    
                            }}>
                                <Text  style={styles.ReviewText}>Leave a review</Text>
                            </TouchableOpacity>}
                    </View>
                </View> 
                :
                null
                )}
                        }
        />
        {currentWork &&
        <Modal
        animationType='none'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
        }}
          >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.titleModal}>Review to {currentWork.nannyProfile.name} </Text>
            <View style={styles.modalActions}>
                <Text style={styles.ageText}>Give some stars!</Text>
                <StarRating
                    disabled={false}
                    containerStyle={styles.starsContainer}
                    starSize={25}
                    maxStars={5}
                    rating={starCount}
                    fullStarColor={'#fff000'}
                    selectedStar={(rating) => setStarCount(rating)}
                />
                <TextInput
                    style={styles.reviewInput}
                    placeholder='Tell how was the experience, how was the nanny, if the chidlren were happy...'
                    placeholderTextColor='#333'
                    multiline={true}
                    maxLength={200}
                    numberOfLines={7}
                    value={reviewText}
                    onChangeText={text => setReviewText(text)}>
                </TextInput>
                {
                    reviewRequiredShow &&
                    <Text style={styles.validationMessage}>Required</Text>
                }
            </View>
                  
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={
                        handleSubmit}
                    >
                      <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => {
                        setReviewRequiredShow(false);
                        setReviewText('');
                        setStarCount(0);                    
                        setModalVisible(false);
                      }}
                    >
                      <EvilIcons name='close' size={20} style={styles.textStyle}></EvilIcons>
                    </TouchableOpacity>
                  </View>
                </View>
          </Modal>}
        </View>
    )
}